import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { handleNotifications } from "@/lib/deposit-monitor";
import { getMinConfirmations } from "@/lib/bsc";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Verify Moralis webhook signature.
 * Moralis signs the raw request body with your webhook secret using SHA3-256.
 */
function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.MORALIS_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[MORALIS WEBHOOK] MORALIS_WEBHOOK_SECRET not set");
    return false;
  }

  const hmac = createHmac("sha3-256", secret).update(body).digest("hex");
  return hmac === signature;
}

/**
 * Moralis Stream webhook endpoint.
 *
 * Moralis sends a POST with decoded ERC-20 Transfer events.
 * Payload shape: https://docs.moralis.io/streams-api/evm/webhook-types
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const bodyTrimmed = rawBody.trim();

    // Moralis sends a test webhook with empty body on stream creation — ack it
    // They may send {} or an empty string.
    if (!bodyTrimmed || bodyTrimmed === "{}" || bodyTrimmed === "[]") {
      console.log("[MORALIS WEBHOOK] Received validation/test request");
      return NextResponse.json({ message: "OK (test)" });
    }

    // Verify signature
    const signature = request.headers.get("x-signature");
    let secret = process.env.MORALIS_WEBHOOK_SECRET;

    // Extremely lenient check for bootstrap mode:
    // Only verify if we have a real-looking secret (not empty, not placeholder)
    const isSecretSet =
      secret &&
      secret.length > 20 &&
      !secret.includes("your_moralis_webhook_secret_here") &&
      secret !== "undefined" &&
      secret !== "null";

    if (!isSecretSet) {
      console.warn(
        `[MORALIS WEBHOOK] Signature check skipped (Secret: ${secret ? "SET but placeholder/invalid" : "NOT SET"})`,
      );
    } else if (!signature || !verifySignature(rawBody, signature)) {
      console.warn("[MORALIS WEBHOOK] Invalid or missing signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Moralis sends confirmed: true once block is confirmed
    const confirmed: boolean = payload.confirmed ?? false;
    const chainId: string = payload.chainId;

    // Only process BSC (chain 56 = 0x38)
    if (chainId !== "0x38") {
      return NextResponse.json({ message: "Ignored (wrong chain)" });
    }

    // Process ERC-20 transfer events
    const erc20Transfers = payload.erc20Transfers || [];
    if (erc20Transfers.length === 0) {
      return NextResponse.json({ message: "No ERC-20 transfers" });
    }

    let processed = 0;
    let skipped = 0;

    for (const transfer of erc20Transfers) {
      // Only process USDT transfers
      if (transfer.contract?.toLowerCase() !== USDT_CONTRACT.toLowerCase()) {
        skipped++;
        continue;
      }

      const toAddress: string = transfer.to;
      const txHash: string = transfer.transactionHash;
      const rawValue: string = transfer.value;
      const decimals = parseInt(transfer.tokenDecimals || "18");
      const amount = parseFloat(rawValue) / Math.pow(10, decimals);

      if (amount <= 0) {
        skipped++;
        continue;
      }

      // Look up wallet owner
      const { data: wallet } = await supabase
        .from("wallets")
        .select("user_id")
        .ilike("address", toAddress)
        .single();

      if (!wallet) {
        skipped++;
        continue;
      }

      // Determine confirmation status
      const minConfirmations = getMinConfirmations();
      // Moralis "confirmed" flag means the block has passed the confirmation threshold
      const blockConfirmations = confirmed ? minConfirmations : 0;
      const status = confirmed ? "confirmed" : "pending";

      // Process deposit using the existing idempotent function
      const { error } = await supabase.rpc("process_bsc_deposit", {
        p_user_id: wallet.user_id,
        p_amount: amount,
        p_tx_hash: txHash,
        p_status: status,
        p_confirmations: blockConfirmations,
      });

      if (error) {
        console.error(
          `[MORALIS WEBHOOK] Error processing deposit ${txHash}:`,
          error,
        );
        continue;
      }

      // Send notifications only for confirmed deposits
      if (status === "confirmed") {
        await handleNotifications(wallet.user_id, amount, txHash);
      }

      processed++;
      console.log(
        `[MORALIS WEBHOOK] Processed ${status} deposit: ${amount} USDT → ${toAddress} (${txHash})`,
      );
    }

    return NextResponse.json({
      message: "Processed",
      processed,
      skipped,
    });
  } catch (error: any) {
    console.error("[MORALIS WEBHOOK] Unhandled error:", error);
    // Return 200 to prevent Moralis from retrying on code errors
    // (only return non-200 for auth failures)
    return NextResponse.json({
      message: "Error (acknowledged)",
      error: error.message,
    });
  }
}

export async function GET() {
  return NextResponse.json({ status: "active", service: "Moralis Webhook" });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
