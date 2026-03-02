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

    const lastBlock = config ? parseInt(config.value as string) : 0;
    const currentBlock = await getCurrentBlockNumber();

    if (currentBlock <= lastBlock) {
      console.log("No new blocks to scan.");
      return result;
    }

    // Limit scan range to avoid RPC timeouts (max 5000 blocks)
    const fromBlock = lastBlock + 1;
    const toBlock = Math.min(currentBlock, fromBlock + 5000);

    // 2. Get all monitored wallets for O(1) lookup
    const { data: wallets } = await supabase
      .from("wallets")
      .select("address, user_id");

    if (!wallets || wallets.length === 0) {
      return result;
    }

    const walletMap = new Map<string, string>(
      wallets.map((w: { address: string; user_id: string }) => [
        w.address.toLowerCase(),
        w.user_id,
      ]),
    );

    // 3. Scan for global transactions
    const transactions = await getGlobalTransactions(fromBlock, toBlock);
    const minConfirmations = getMinConfirmations();

    for (const tx of transactions) {
      const userId = walletMap.get(tx.to.toLowerCase());
      if (!userId) continue;

      try {
        const parsedTx = parseTransaction(tx);
        // During global scan, confirmations for the specific block are calculated
        // but we might need to fetch the specific block number if BscScanTransaction doesn't have it.
        // For simplicity in this scan, we treat new ones as pending or confirmed based on range.
        // Re-fetching exact confirmations is safer.
        const confirmations = await getTransactionConfirmations(tx.hash);
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

    for (const deposit of pendingDeposits) {
      try {
        const confirmations = await getTransactionConfirmations(
          deposit.tx_hash,
        );
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

async function handleNotifications(
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

    await sendPushNotification(userId, {
      title: "Deposit Confirmed",
      body: `Your deposit of $${amount} USDT has been confirmed.`,
      url: "/dashboard/wallet",
    });
  } catch (err) {
    console.error("Notification error:", err);
  }
}
