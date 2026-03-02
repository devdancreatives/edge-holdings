const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Manually parse .env.local
let env = {};
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join("=").trim().replace(/"/g, "");
      if (key && value) {
        env[key] = value;
      }
    }
  });
} catch (e) {
  console.error("Could not read .env.local", e);
}

const supabaseUrl =
  env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("Attempting to INSERT dummy transaction via Service Client...");

  // We need a valid user ID. Let's fetch the first user.
  const { data: users, error: userError } = await supabase
    .from("users")
    .select("id")
    .limit(1);
  if (userError || !users || users.length === 0) {
    console.error("Cannot find a user to attach transaction to.", userError);
    return;
  }
  const userId = users[0].id;
  console.log("Using User ID:", userId);

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      type: "trade_entry", // Use trade_entry to verify if stats pick it up
      amount: -10.5,
      description: "DEBUG_TEST_TRANSACTION",
    })
    .select();

  if (error) {
    console.error("INSERT FAILED:", error);
    return;
  }

  console.log("INSERT SUCCESS:", data);

  // Check count again
  const { count } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true });
  console.log("Total Transactions now:", count);
}

main();
