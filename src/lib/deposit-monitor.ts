import { createClient } from "@supabase/supabase-js";
import {
  getGlobalTransactions,
  getCurrentBlockNumber,
  getTransactionConfirmations,
  parseTransaction,
  getMinConfirmations,
  type BscScanTransaction,
} from "./bsc";
import { sendDepositNotification } from "./email";
import { sendPushNotification } from "./push-notifications";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface DepositResult {
  processed: number;
  pending: number;
  errors: number;
  debug?: {
    lastBlock: number;
    currentBlock: number;
    scanFromBlock: number;
    scanToBlock: number;
    walletsMonitored: number;
    walletAddresses: string[];
    rawTransactionsFound: number;
    skipped?: string;
  };
}

/**
 * Main function to monitor BSC for new deposits using scalable global scanning
 */
export async function monitorDeposits(): Promise<DepositResult> {
  const result: DepositResult = {
    processed: 0,
    pending: 0,
    errors: 0,
  };

  try {
    // 1. Get last processed block
    const { data: config } = await supabase
      .from("system_configs")
      .select("value")
      .eq("key", "last_bsc_block")
      .single();

    // Handle JSONB value - could be number (46000000) or string ("84280000")
    let lastBlock = 0;
    if (config?.value !== null && config?.value !== undefined) {
      const raw = config.value;
      if (typeof raw === "number") {
        lastBlock = raw;
      } else if (typeof raw === "string") {
        lastBlock = parseInt(raw, 10);
      } else {
        // JSONB object/other — try JSON.parse for stringified numbers
        lastBlock = parseInt(String(raw), 10);
      }
      if (isNaN(lastBlock)) {
        console.error(
          `[DEPOSIT MONITOR] Invalid last_bsc_block value: ${JSON.stringify(raw)}. Resetting.`,
        );
        lastBlock = 0;
      }
    }

    const currentBlock = await getCurrentBlockNumber();

    // 1b. Automatic Jump Logic
    // If we are more than 100,000 blocks behind, jump to caught up - 5000 blocks
    // Use a lookback buffer to prevent race conditions where a tx is mined
    // right before/after the checkpoint advances. process_bsc_deposit is
    // idempotent on tx_hash, so re-scanning a few blocks is safe.
    const LOOKBACK_BUFFER = 50; // ~2.5 minutes at 3s/block
    let scanFrom = Math.max(0, lastBlock - LOOKBACK_BUFFER + 1);
    if (currentBlock - lastBlock > 100000) {
      console.log(
        `[DEPOSIT MONITOR] Lag too large (${currentBlock - lastBlock}). Jumping to ${currentBlock - 5000}`,
      );
      scanFrom = currentBlock - 5000;
    }

    if (currentBlock <= lastBlock && currentBlock - lastBlock <= 100000) {
      console.log("No new blocks to scan.");
      result.debug = {
        lastBlock,
        currentBlock,
        scanFromBlock: 0,
        scanToBlock: 0,
        walletsMonitored: 0,
        walletAddresses: [],
        rawTransactionsFound: 0,
        skipped: "No new blocks to scan (currentBlock <= lastBlock)",
      };
      return result;
    }

    // Scan up to 5000 blocks per cron invocation (safe with topic filters)
    const fromBlock = scanFrom;
    const toBlock = Math.min(currentBlock, fromBlock + 5000);

    // 2. Get all monitored wallets for O(1) lookup
    const { data: wallets } = await supabase
      .from("wallets")
      .select("address, user_id");

    if (!wallets || wallets.length === 0) {
      result.debug = {
        lastBlock,
        currentBlock,
        scanFromBlock: fromBlock,
        scanToBlock: toBlock,
        walletsMonitored: 0,
        walletAddresses: [],
        rawTransactionsFound: 0,
        skipped: "No wallets found in database",
      };
      return result;
    }

    const walletMap = new Map<string, string>(
      wallets.map((w: { address: string; user_id: string }) => [
        w.address.toLowerCase(),
        w.user_id,
      ]),
    );

    // 3. Scan for transactions filtered to our wallet addresses
    const walletAddresses = wallets.map((w: { address: string }) => w.address);
    const transactions = await getGlobalTransactions(
      fromBlock,
      toBlock,
      walletAddresses,
    );
    const minConfirmations = getMinConfirmations();

    // Set debug info
    result.debug = {
      lastBlock,
      currentBlock,
      scanFromBlock: fromBlock,
      scanToBlock: toBlock,
      walletsMonitored: wallets.length,
      walletAddresses,
      rawTransactionsFound: transactions.length,
    };

    for (const tx of transactions) {
      const userId = walletMap.get(tx.to.toLowerCase());
      if (!userId) continue;

      try {
        const parsedTx = parseTransaction(tx);
        // Use confirmations already computed during the scan
        const confirmations = parseInt(tx.confirmations) || 0;
        const status =
          confirmations >= minConfirmations ? "confirmed" : "pending";

        const { error } = await supabase.rpc("process_bsc_deposit", {
          p_user_id: userId,
          p_amount: parsedTx.amount,
          p_tx_hash: tx.hash,
          p_status: status,
          p_confirmations: confirmations,
        });

        if (error) throw error;

        if (status === "confirmed") {
          result.processed++;
          await handleNotifications(userId, parsedTx.amount, tx.hash);
        } else {
          result.pending++;
        }
      } catch (err) {
        console.error(`Error processing tx ${tx.hash}:`, err);
        result.errors++;
      }
    }

    // 4. Update last processed block
    await supabase
      .from("system_configs")
      .upsert(
        { key: "last_bsc_block", value: toBlock.toString() },
        { onConflict: "key" },
      );

    console.log(
      `BSC monitoring complete. Scanned to ${toBlock}. Result:`,
      result,
    );
    return result;
  } catch (error) {
    console.error("Error in monitorDeposits:", error);
    return result;
  }
}

/**
 * Scan specific wallet transactions (lookback ~2 hours via RPC logs)
 * This is used for manual user-triggered sync.
 */
export async function syncSpecificWallet(userId: string): Promise<number> {
  try {
    const { data: wallet } = await supabase
      .from("wallets")
      .select("address")
      .eq("user_id", userId)
      .single();

    if (!wallet) return 0;

    const { getWalletTransactions } = require("./bsc");
    const transactions = await getWalletTransactions(wallet.address);
    const minConfirmations = getMinConfirmations();

    let newCount = 0;

    for (const tx of transactions) {
      try {
        const confirmations = parseInt(tx.confirmations);
        const status =
          confirmations >= minConfirmations ? "confirmed" : "pending";
        const parsedTx = parseTransaction(tx);

        const { error } = await supabase.rpc("process_bsc_deposit", {
          p_user_id: userId,
          p_amount: parsedTx.amount,
          p_tx_hash: tx.hash,
          p_status: status,
          p_confirmations: confirmations,
        });

        if (error) throw error;
        if (status === "confirmed") {
          newCount++;
          await handleNotifications(userId, parsedTx.amount, tx.hash);
        }
      } catch (err) {
        console.error(
          `Error syncing tx ${tx.hash} for wallet ${wallet.address}:`,
          err,
        );
      }
    }

    return newCount;
  } catch (error) {
    console.error("Error in syncSpecificWallet:", error);
    return 0;
  }
}

/**
 * Check status of pending deposits and process if confirmed
 */
export async function checkPendingDeposits(): Promise<number> {
  try {
    const { data: pendingDeposits } = await supabase
      .from("deposits")
      .select("*")
      .eq("status", "pending");

    if (!pendingDeposits || pendingDeposits.length === 0) {
      return 0;
    }

    let newlyConfirmed = 0;
    const minConfirmations = getMinConfirmations();

    // Fetch all confirmations in parallel to avoid sequential RPC waits
    const confirmationResults = await Promise.allSettled(
      pendingDeposits.map((deposit) =>
        getTransactionConfirmations(deposit.tx_hash),
      ),
    );

    for (let i = 0; i < pendingDeposits.length; i++) {
      const deposit = pendingDeposits[i];
      const result = confirmationResults[i];

      if (result.status === "rejected") {
        console.error(
          `Error fetching confirmations for tx ${deposit.tx_hash}:`,
          result.reason,
        );
        continue;
      }

      try {
        const confirmations = result.value;
        const status =
          confirmations >= minConfirmations ? "confirmed" : "pending";

        const { error } = await supabase.rpc("process_bsc_deposit", {
          p_user_id: deposit.user_id,
          p_amount: deposit.amount,
          p_tx_hash: deposit.tx_hash,
          p_status: status,
          p_confirmations: confirmations,
        });

        if (error) throw error;

        if (status === "confirmed") {
          newlyConfirmed++;
          await handleNotifications(
            deposit.user_id,
            deposit.amount,
            deposit.tx_hash,
          );
        }
      } catch (err) {
        console.error(`Error re-checking pending tx ${deposit.tx_hash}:`, err);
      }
    }

    return newlyConfirmed;
  } catch (error) {
    console.error("Error checking pending deposits:", error);
    return 0;
  }
}

export async function handleNotifications(
  userId: string,
  amount: number,
  txHash: string,
) {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (user?.email) {
      await sendDepositNotification(
        user.email,
        user.full_name || "User",
        amount,
        txHash,
      );
    }

    // Also notify admin
    try {
      const { data: admins } = await supabase
        .from("users")
        .select("email")
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        const { sendAdminDepositAlert } = require("./email");
        for (const admin of admins) {
          if (admin.email) {
            await sendAdminDepositAlert(
              admin.email,
              user?.full_name || "User",
              amount,
              txHash,
            );
            // Small delay to avoid Resend rate limit (429)
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }
    } catch (adminErr) {
      console.error("Admin notification error:", adminErr);
    }

    await sendPushNotification(userId, {
      title: "Deposit Confirmed",
      body: `Your deposit of $${amount} USDT has been confirmed.`,
      url: "/dashboard/wallet",
    });
  } catch (err) {
    console.error("Notification error:", err);
  }
}
