require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function checkInvestments() {
  // First, let's check the schema of the investments table
  const { data, error } = await supabase
    .from("investments")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error querying investments:", error.message);
  } else {
    console.log("Successfully queried investments.");
    console.log("Data:", data);
    if (data.length > 0) {
      console.log("Columns:", Object.keys(data[0]));
    } else {
      console.log(
        "No investments found to check columns. Attempting to insert a dummy to see if fee exists...",
      );
    }
  }
}

checkInvestments();
