import Moralis from "moralis";
import { join } from "path";
import { readFileSync, existsSync } from "fs";

// Manually load .env.local
const envPath = join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...value] = line.split("=");
    if (key && value.length > 0) {
      process.env[key.trim()] = value
        .join("=")
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  });
}

async function checkStatus() {
  const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

  if (!MORALIS_API_KEY) {
    console.error("❌ MORALIS_API_KEY not set.");
    process.exit(1);
  }

  await Moralis.start({ apiKey: MORALIS_API_KEY });

  const streams = await Moralis.Streams.getAll({ limit: 10 });
  const stream = streams.raw.result.find((s: any) => s.tag === "usdt-deposits");

  if (!stream) {
    console.log("❌ No stream found with tag 'usdt-deposits'.");
    return;
  }

  console.log("\n📡 --- Stream Status ---");
  console.log(`  Name:   ${stream.description}`);
  console.log(`  ID:     ${stream.id}`);
  console.log(
    `  Status: ${stream.status === "active" ? "✅ ACTIVE" : "⚠️ " + (stream.status || "UNKNOWN").toUpperCase()}`,
  );
  console.log(`  URL:    ${stream.webhookUrl}`);
  console.log(`  Chains: ${stream.chainIds?.join(", ") || "None"}`);
  console.log(`  Tag:    ${stream.tag}`);

  console.log(
    "\n� Note: To check delivery logs, visit the Moralis Dashboard (Streams > Stream > History).",
  );
}

checkStatus();
