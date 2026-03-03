import { NextRequest, NextResponse } from "next/server";
import { monitorDeposits, checkPendingDeposits } from "@/lib/deposit-monitor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60s for BSC RPC calls

/**
 * Cron endpoint to monitor deposits
 * Protected by CRON_SECRET environment variable
 *
 * Usage:
 * - Vercel Cron: Runs automatically based on vercel.json schedule
 * - Manual: GET /api/cron/monitor-deposits?secret=YOUR_CRON_SECRET
 * - cron-job.org: GET request with secret parameter
 */

async function handleMonitoring(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const secretParam = request.nextUrl.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    // Check authorization (Vercel Cron uses Authorization header)
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` || secretParam === cronSecret;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Starting deposit monitoring...");
    const startTime = Date.now();

    // Monitor new deposits
    const newDeposits = await monitorDeposits();

    // Check pending deposits for confirmations
    const confirmedPending = await checkPendingDeposits();

    const duration = Date.now() - startTime;

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      newDeposits: {
        processed: newDeposits.processed,
        pending: newDeposits.pending,
        errors: newDeposits.errors,
      },
      pendingConfirmed: confirmedPending,
      total: newDeposits.processed + confirmedPending,
    };

    console.log("✅ Deposit monitoring complete:", result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Error in deposit monitoring:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleMonitoring(request);
}

export async function POST(request: NextRequest) {
  return handleMonitoring(request);
}
