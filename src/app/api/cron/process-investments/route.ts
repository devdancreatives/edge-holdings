import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    // 1. Find active investments that have ended
    const now = new Date().toISOString();
    const { data: maturedInvestments, error: fetchError } = await supabase
      .from("investments")
      .select("*")
      .eq("status", "active")
      .lte("end_date", now);

    if (fetchError) throw fetchError;

    if (!maturedInvestments || maturedInvestments.length === 0) {
      return NextResponse.json({ message: "No matured investments found" });
    }

    const results = [];

    // 2. Process each investment
    for (const inv of maturedInvestments) {
      // Calculate Profit
      const ROI_PERCENTAGE_PER_MONTH = 0.07;
      let profit = 0;
      let roiPercentageTotal = 0;

      if (inv.duration_months === 0) {
        // Test Investment: Fixed 0.1% profit
        roiPercentageTotal = 0.001;
        profit = inv.amount * roiPercentageTotal;
      } else {
        roiPercentageTotal = ROI_PERCENTAGE_PER_MONTH * inv.duration_months;
        profit = inv.amount * roiPercentageTotal;
      }

      // Update Investment Status -> completed
      const { error: updateError } = await supabase
        .from("investments")
        .update({ status: "completed" })
        .eq("id", inv.id);

      if (updateError) {
        console.error(`Failed to update investment ${inv.id}:`, updateError);
        results.push({
          id: inv.id,
          status: "failed",
          error: updateError.message,
        });
        continue;
      }

      // Record ROI Snapshot (This credits the profit to the user's "profit" balance calculation)
      // Note: Principal is returned because 'getAvailableBalance' stops deducting it when status is 'completed'.
      const { error: roiError } = await supabase.from("roi_snapshots").insert({
        user_id: inv.user_id,
        date: new Date().toISOString(),
        profit_amount: profit,
        roi_percentage: roiPercentageTotal * 100,
      });

      if (roiError) {
        console.error(`Failed to create ROI snapshot for ${inv.id}:`, roiError);
        // Warning: Status is completed but ROI might be missing. Transactional integrity issue here without stored procedures.
        // For this MVP, we log it.
        results.push({
          id: inv.id,
          status: "partial_fail",
          error: roiError.message,
        });
      } else {
        // Log Transactions
        // 1. Profit Payout
        await supabase.from("transactions").insert({
          user_id: inv.user_id,
          type: "profit_payout",
          amount: profit,
          description:
            inv.duration_months === 0
              ? `ROI Payout for test investment`
              : `ROI Payout for ${inv.duration_months}-month investment`,
        });

        // 2. Principal Return
        await supabase.from("transactions").insert({
          user_id: inv.user_id,
          type: "deposit", // Using 'deposit' as a proxy for 'credit' since it shows as '+'
          amount: inv.amount,
          description: `Principal returned from matured investment`,
        });

        results.push({ id: inv.id, status: "success", profit });
      }
    }

    return NextResponse.json({
      message: `Processed ${results.length} investments`,
      details: results,
    });
  } catch (error: any) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
