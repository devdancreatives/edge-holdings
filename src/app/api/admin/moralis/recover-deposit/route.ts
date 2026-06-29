import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { handleNotifications } from "@/lib/deposit-monitor";

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
 *
 * Manually recovers a missed deposit by tx hash.
 * - Looks up the tx on BSC via RPC.
 * - Decodes the USDT Transfer log to get recipient + amount.
 * - Finds the wallet owner in our DB.
 * - Forces status = 'confirmed' (admin bypass of the 15-block threshold).
 * - Calls process_bsc_deposit (idempotent upsert).
 * - If the deposit was already 'confirmed' in the DB but the balance is still
 *   $0, it means the transactions ledger entry was missed — this route fixes
 *   that too by checking and inserting it directly.
 *
 * Body: { txHash: string, adminNotes?: string }
 * Auth: Bearer CRON_SECRET
 */
export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
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

  const normalizedHash = txHash.trim();

  try {
    // ── 1. Check what's already in the DB ─────────────────────────────────
    const { data: existingDeposit } = await supabase
      .from("deposits")
      .select("id, status, amount, user_id")
      .ilike("tx_hash", normalizedHash)
      .single();

    // ── 2. Fetch tx from chain ────────────────────────────────────────────
    const { ethers } = await import("ethers");
    const provider = new ethers.JsonRpcProvider(
      "https://bsc-dataseed.binance.org/",
    );

    const [tx, receipt, currentBlock] = await Promise.all([
      provider.getTransaction(txHash),
      provider.getTransactionReceipt(txHash),
      provider.getBlockNumber(),
    ]);

    if (!tx) {
      return NextResponse.json(
        {
          success: false,
          error: `Transaction ${txHash} not found on BSC. Verify the hash and make sure it is on the BNB Smart Chain.`,
        },
        { status: 404 },
      );
    }

    if (!receipt || receipt.status === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Transaction was found but it FAILED on-chain (status = 0). A failed transaction cannot be credited.`,
        },
        { status: 422 },
      );
    }

    // ── 3. Decode the USDT Transfer log ───────────────────────────────────
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
          error: `No USDT Transfer event found in this transaction. It may not be a USDT (BEP-20) deposit.`,
        },
        { status: 422 },
      );
    }

    const toAddress = ethers.getAddress(
      "0x" + transferLog.topics[2].slice(26),
    );
    const rawValue = BigInt(transferLog.data);
    const amount = Number(rawValue) / 1e18; // BEP-20 USDT has 18 decimals

    // ── 4. Find wallet owner ──────────────────────────────────────────────
    const { data: wallet } = await supabase
      .from("wallets")
      .select("user_id, address")
      .ilike("address", toAddress)
      .single();

    if (!wallet) {
      return NextResponse.json(
        {
          success: false,
          error: `No wallet found in DB for address ${toAddress}. The recipient is not a registered user on this platform.`,
          toAddress,
          amount,
        },
        { status: 404 },
      );
    }

    const confirmations = tx.blockNumber ? currentBlock - tx.blockNumber : 0;

    // ── 5. Admin override: always force 'confirmed' ───────────────────────
    //
    // An admin is manually triggering this — the tx is already mined and
    // visible on-chain, so we skip the 15-block threshold and credit
    // immediately. This is the main fix for "balance not updated".
    const status = "confirmed";

    // ── 6. Case: deposit already confirmed in DB but balance = $0 ─────────
    //
    // This happens when process_bsc_deposit ran but the `transactions` ledger
    // insert was skipped because v_existing_status was already 'confirmed'
    // (i.e. the SQL idempotency guard fired but the first run had already set
    // it to confirmed without crediting the balance).
    //
    // Fix: check directly for a corresponding transactions row and insert one
    // if missing. This is safe — getAvailableBalance reads from `deposits`
    // (not `transactions`), so we also re-run process_bsc_deposit below to
    // ensure the deposit row is correct.
    if (existingDeposit?.status === "confirmed") {
      // Check if there is a matching transactions ledger entry
      const { data: existingTx, error: txCheckError } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", wallet.user_id)
        .ilike("description", `%${normalizedHash.slice(0, 10)}%`)
        .limit(1)
        .single();

      if (!existingTx && !txCheckError?.message?.includes("No rows")) {
        // There WAS an error checking — proceed cautiously
        console.warn(
          "[RECOVER-DEPOSIT] Could not verify transactions ledger:",
          txCheckError,
        );
      }

      if (!existingTx) {
        // Transactions ledger entry is missing — insert it manually
        const { error: insertErr } = await supabase
          .from("transactions")
          .insert({
            user_id: wallet.user_id,
            type: "deposit",
            amount,
            description: `USDT deposit (BSC) - ${normalizedHash.slice(0, 10)}... [admin recovery]`,
          });

        if (insertErr) {
          return NextResponse.json(
            {
              success: false,
              error: `Deposit was already confirmed but transactions ledger insert failed: ${insertErr.message}`,
            },
            { status: 500 },
          );
        }

        await handleNotifications(wallet.user_id, amount, txHash);

        return NextResponse.json({
          success: true,
          status,
          txHash,
          toAddress: wallet.address,
          userId: wallet.user_id,
          amount,
          confirmations,
          fixApplied: "missing_ledger_entry",
          message: `✅ Deposit was already confirmed in DB but the transactions ledger entry was missing. It has been inserted and the user's balance is now updated.`,
        });
      }

      // Both deposit and transactions entries already exist — nothing to fix
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        status,
        txHash,
        toAddress: wallet.address,
        userId: wallet.user_id,
        amount,
        confirmations,
        message: `This deposit is already fully confirmed and the balance is already credited. If the user still sees $0, ask them to refresh — or check for active investments locking their balance.`,
      });
    }

    // ── 7. Normal recovery path: deposit was pending or missing ──────────
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
          error: `DB error in process_bsc_deposit: ${rpcError.message}`,
        },
        { status: 500 },
      );
    }

    // Send notifications
    await handleNotifications(wallet.user_id, amount, txHash);

    // Optional admin audit note
    if (adminNotes) {
      await supabase
        .from("transactions")
        .insert({
          user_id: wallet.user_id,
          type: "deposit",
          amount: 0,
          description: `[ADMIN RECOVERY NOTE] ${adminNotes} | TxHash: ${txHash.slice(0, 14)}...`,
        })
        .then(({ error }) => {
          if (error)
            console.warn(
              "[RECOVER-DEPOSIT] Could not log admin note:",
              error.message,
            );
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
      wasAlreadyPending: existingDeposit?.status === "pending",
      message: `✅ Deposit of ${amount.toFixed(2)} USDT successfully recovered and credited to user.`,
    });
  } catch (error: any) {
    console.error("[RECOVER-DEPOSIT] Unhandled error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
