import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Moralis from "moralis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/admin/moralis/sync-wallets
 * Re-registers ALL wallet addresses in the DB with the Moralis stream.
 * Protected by CRON_SECRET (same as cron routes).
 *
 * Returns a per-address report so you can see exactly which ones
 * succeeded, were already present, or failed.
 */
export async function POST(request: NextRequest) {
  // --- Auth ---
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
  if (!MORALIS_API_KEY) {
    return NextResponse.json(
      { error: "MORALIS_API_KEY is not configured" },
      { status: 500 },
    );
  }

  try {
    // 1. Start Moralis SDK
    if (!Moralis.Core.isStarted) {
      await Moralis.start({ apiKey: MORALIS_API_KEY });
    }

    // 2. Find the usdt-deposits stream
    const streams = await Moralis.Streams.getAll({ limit: 100 });
    const stream = streams.raw.result.find(
      (s: any) => s.tag === "usdt-deposits",
    );

    if (!stream) {
      return NextResponse.json(
        {
          error:
            "Moralis stream with tag 'usdt-deposits' not found. Please create it in the Moralis dashboard first.",
        },
        { status: 404 },
      );
    }

    // 3. Fetch all existing addresses already in the stream (for duplicate detection)
    let existingAddresses = new Set<string>();
    try {
      const streamAddresses = await Moralis.Streams.getAddresses({
        id: stream.id,
        limit: 1000,
      });
      (streamAddresses.raw.result || []).forEach((a: any) => {
        if (a.address) existingAddresses.add(a.address.toLowerCase());
      });
    } catch {
      // Non-fatal — we'll just try to add all addresses regardless
      console.warn("[SYNC-WALLETS] Could not fetch existing stream addresses.");
    }

    // 4. Fetch all wallets from DB
    const { data: wallets, error: walletError } = await supabase
      .from("wallets")
      .select("address, user_id");

    if (walletError) {
      return NextResponse.json(
        { error: `Failed to fetch wallets: ${walletError.message}` },
        { status: 500 },
      );
    }

    if (!wallets || wallets.length === 0) {
      return NextResponse.json({ message: "No wallets found in database", results: [] });
    }

    // 5. Register each address
    const results: { address: string; userId: string; status: string; error?: string }[] = [];
    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const wallet of wallets) {
      const address: string = wallet.address;
      const userId: string = wallet.user_id;

      if (existingAddresses.has(address.toLowerCase())) {
        results.push({ address, userId, status: "already_registered" });
        skippedCount++;
        continue;
      }

      try {
        await Moralis.Streams.addAddress({ id: stream.id, address });
        results.push({ address, userId, status: "added" });
        existingAddresses.add(address.toLowerCase());
        successCount++;
      } catch (err: any) {
        results.push({
          address,
          userId,
          status: "failed",
          error: err?.message || "Unknown error",
        });
        failedCount++;
      }
    }

    return NextResponse.json({
      streamId: stream.id,
      streamTag: stream.tag,
      totalWallets: wallets.length,
      added: successCount,
      alreadyRegistered: skippedCount,
      failed: failedCount,
      results,
    });
  } catch (error: any) {
    console.error("[SYNC-WALLETS] Unhandled error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
