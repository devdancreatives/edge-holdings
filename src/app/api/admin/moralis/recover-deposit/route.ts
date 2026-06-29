import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { handleNotifications } from "@/lib/deposit-monitor";
import { getTransactionConfirmations } from "@/lib/bsc";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/admin/moralis/recover-deposit
 * Manually recovers a missed deposit by tx hash.
 * Looks up the tx on-chain, finds the wallet owner, and processes it
 * through the same idempotent process_bsc_deposit function.
 *
 * Body: { txHash: string, adminNotes?: string }
 * Auth: Bearer CRON_SECRET
 */
export async function POST(request: NextRequest) {
  // --- Auth ---
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { txHash?: string; adminNotes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { txHash, adminNotes } = body;
  if (!txHash || typeof txHash !== "string" || !txHash.startsWith("0x")) {
    return NextResponse.json(
      { error: "A valid txHash (starting with 0x) is required" },
      { status: 400 },
    );
  }

  const normalizedHash = txHash.trim().toLowerCase();

  try {
    // 1. Check if already fully confirmed in DB
    const { data: existing } = await supabase
      .from("deposits")
      .select("id, status, amount, user_id")
      .ilike("tx_hash", normalizedHash)
      .single();

    if (existing?.status === "confirmed") {
      return NextResponse.json({
        success: false,
        alreadyProcessed: true,
        message: `This deposit (${normalizedHash.slice(0, 10)}...) is already confirmed in the database.`,
        deposit: existing,
      });
    }

    // 2. Fetch the transaction from chain via ethers RPC
    const { ethers } = await import("ethers");
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");

    const [tx, receipt, currentBlock] = await Promise.all([
      provider.getTransaction(txHash),
      provider.getTransactionReceipt(txHash),
      provider.getBlockNumber(),
    ]);

    if (!tx) {
      return NextResponse.json(
        {
          success: false,
          error: `Transaction ${txHash} not found on BSC. Check the hash and chain.`,
        },
        { status: 404 },
      );
    }

    if (!receipt || !receipt.status) {
      return NextResponse.json(
        {
          success: false,
          error: `Transaction found but has NOT been mined/confirmed on chain yet, or failed (status=0).`,
        },
        { status: 422 },
      );
    }

    // 3. Parse the ERC-20 Transfer log from the receipt
    const TRANSFER_TOPIC =
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

    const transferLog = receipt.logs.find(
      (log) =>
        log.address.toLowerCase() === USDT_CONTRACT.toLowerCase() &&
        log.topics[0] === TRANSFER_TOPIC,
    );

    if (!transferLog) {
      return NextResponse.json(
        {
          success: false,
          error: `No USDT Transfer event found in this transaction. It may not be a USDT deposit.`,
        },
        { status: 422 },
      );
    }

    // Decode `to` address (topic[2]) and value (data)
    const toAddress = ethers.getAddress("0x" + transferLog.topics[2].slice(26));
    const rawValue = BigInt(transferLog.data);
    const amount = Number(rawValue) / 1e18; // USDT has 18 decimals on BSC

    // 4. Look up wallet owner
    const { data: wallet } = await supabase
      .from("wallets")
      .select("user_id, address")
      .ilike("address", toAddress)
      .single();

    if (!wallet) {
      return NextResponse.json(
        {
          success: false,
          error: `No wallet found in DB for address ${toAddress}. The deposit recipient is not a registered user.`,
          toAddress,
          amount,
        },
        { status: 404 },
      );
    }

    // 5. Calculate confirmations
    const confirmations = tx.blockNumber ? currentBlock - tx.blockNumber : 0;
    const MIN_CONFIRMATIONS = parseInt(process.env.BSC_MIN_CONFIRMATIONS || "15");
    const status = confirmations >= MIN_CONFIRMATIONS ? "confirmed" : "pending";

    // 6. Process via the existing idempotent DB function
    const { error: rpcError } = await supabase.rpc("process_bsc_deposit", {
      p_user_id: wallet.user_id,
      p_amount: amount,
      p_tx_hash: txHash,
      p_status: status,
      p_confirmations: confirmations,
    });

    if (rpcError) {
      return NextResponse.json(
        {
          success: false,
          error: `DB error: ${rpcError.message}`,
        },
        { status: 500 },
      );
    }

    // 7. Send notifications if confirmed
    if (status === "confirmed") {
      await handleNotifications(wallet.user_id, amount, txHash);
    }

    // 8. Log admin action for audit trail
    if (adminNotes) {
      await supabase.from("transactions").insert({
        user_id: wallet.user_id,
        type: "deposit",
        amount: 0,
        description: `[ADMIN RECOVERY NOTE] ${adminNotes} | TxHash: ${txHash.slice(0, 14)}...`,
      }).then(({ error }) => {
        if (error) console.warn("[RECOVER-DEPOSIT] Could not log admin note:", error.message);
      });
    }

    return NextResponse.json({
      success: true,
      status,
      txHash,
      toAddress: wallet.address,
      userId: wallet.user_id,
      amount,
      confirmations,
      minConfirmations: MIN_CONFIRMATIONS,
      wasAlreadyPending: existing?.status === "pending",
      message:
        status === "confirmed"
          ? `✅ Deposit of ${amount} USDT successfully recovered and credited to user.`
          : `⏳ Deposit recorded as pending (${confirmations}/${MIN_CONFIRMATIONS} confirmations). Run again once block is confirmed.`,
    });
  } catch (error: any) {
    console.error("[RECOVER-DEPOSIT] Unhandled error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
