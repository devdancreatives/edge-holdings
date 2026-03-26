const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log("Starting Daily Payout Verification...");

  // 1. Get a user
  const { data: users } = await supabase.from("users").select("id").limit(1);
  if (!users || users.length === 0) {
    console.error("No users found in DB");
    return;
  }
  const userId = users[0].id;
  console.log("Using User ID:", userId);

  // 2. Create a backdated investment
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

  const { data: inv, error: invError } = await supabase
    .from("investments")
    .insert({
      user_id: userId,
      amount: 100,
      roi_rate: 1.0, // 100% per month for easy math
      duration_months: 1,
      start_date: twoDaysAgo.toISOString(),
      last_payout_date: twoDaysAgo.toISOString(),
      end_date: oneMonthFromNow.toISOString(),
      status: "active",
      plan_type: "test_daily"
    })
    .select()
    .single();

  if (invError) {
    console.error("Failed to create test investment:", invError);
    return;
  }
  console.log("Created test investment ID:", inv.id);

  // 3. Simulate Cron Job Logic (simplified)
  console.log("Simulating Cron Job...");
  const now = new Date();
  const lastPayout = new Date(inv.last_payout_date);
  const diffMs = now.getTime() - lastPayout.getTime();
  const daysToPay = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  console.log("Days to pay:", daysToPay); // Should be 2

  if (daysToPay < 1) {
    console.error("Error: Expected at least 1 day to pay");
  } else {
    // We would normally call the API route here, but for this script we just verify the math and logic.
    const dailyProfit = (inv.amount * inv.roi_rate) / 30;
    console.log("Daily Profit Calculated:", dailyProfit);
    console.log("Expected Total Profit Sum:", dailyProfit * daysToPay);

    // Call the actual endpoint to test the full stack
    const cronSecret = process.env.CRON_SECRET;
    const baseUrl = "http://localhost:3000"; // Assuming local dev server is running or we just test logic
    console.log("Note: To fully test, run 'npm run dev' and trigger: " + baseUrl + "/api/cron/process-investments?secret=" + cronSecret);
  }

  // 4. Cleanup (Optional: uncomment to remove test data)
  // await supabase.from("investments").delete().eq("id", inv.id);
  // console.log("Cleaned up test investment");
}

test();
