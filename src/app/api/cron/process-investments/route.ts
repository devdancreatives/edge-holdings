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
    // 1. Find all active investments
    const now = new Date();
    const { data: activeInvestments, error: fetchError } = await supabase
      .from("investments")
      .select("*")
      .eq("status", "active");

    if (fetchError) throw fetchError;

    if (!activeInvestments || activeInvestments.length === 0) {
      return NextResponse.json({ message: "No active investments found" });
    }

    const results = [];

    // 2. Process each investment
    for (const inv of activeInvestments) {
      const lastPayout = new Date(inv.last_payout_date || inv.start_date);
      const endDate = new Date(inv.end_date);
      
      // Calculate how many full days have passed since last payout
      const diffMs = now.getTime() - lastPayout.getTime();
      const daysToPay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let profitPaidToday = 0;
      let statusUpdated = false;

      if (daysToPay >= 1) {
        let totalDailyProfit = 0;
        const ROI_PERCENTAGE_PER_MONTH_DEFAULT = 0.25;
        const rateToUse = inv.roi_rate || ROI_PERCENTAGE_PER_MONTH_DEFAULT;

        // Formula: ROI is per month. Monthly Profit = Amount * Rate. Daily Profit = Monthly Profit / 30.
        const dailyProfit = (inv.amount * rateToUse) / 30;

        for (let i = 0; i < daysToPay; i++) {
          totalDailyProfit += dailyProfit;
          
          // Record ROI Snapshot for each day
          const payoutDate = new Date(lastPayout);
          payoutDate.setDate(payoutDate.getDate() + i + 1);

          await supabase.from("roi_snapshots").insert({
            user_id: inv.user_id,
            date: payoutDate.toISOString().split("T")[0],
            profit_amount: dailyProfit,
            roi_percentage: (rateToUse / 30) * 100,
          });

          // Log Transaction
          await supabase.from("transactions").insert({
            user_id: inv.user_id,
            type: "profit_payout",
            amount: dailyProfit,
            description: `Daily ROI Payout for ${inv.duration_months === 0 ? "test" : inv.duration_months + "-month"} investment`,
          });
        }

        profitPaidToday = totalDailyProfit;

        // Update last_payout_date
        const newPayoutDate = new Date(lastPayout);
        newPayoutDate.setDate(newPayoutDate.getDate() + daysToPay);
        
        await supabase
          .from("investments")
          .update({ last_payout_date: newPayoutDate.toISOString() })
          .eq("id", inv.id);
      }

      // 3. Check if matured
      if (now >= endDate) {
        // Update Investment Status -> completed
        const { error: updateError } = await supabase
          .from("investments")
          .update({ status: "completed" })
          .eq("id", inv.id);

        if (!updateError) {
          // Return Principal
          await supabase.from("transactions").insert({
            user_id: inv.user_id,
            type: "deposit",
            amount: inv.amount,
            description: `Principal returned from matured investment`,
          });
          statusUpdated = true;
        }
      }

      if (profitPaidToday > 0 || statusUpdated) {
        results.push({ 
          id: inv.id, 
          profit: profitPaidToday, 
          completed: statusUpdated 
        });
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
