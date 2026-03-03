import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

// Manually load .env.local because ts-node/tsx doesn't do it automatically
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

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const WEBHOOK_URL =
  process.env.WEBHOOK_URL ||
  "https://edge-holdings.vercel.app/api/webhooks/moralis";

const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getWalletAddresses(): Promise<string[]> {
  const { data: wallets, error } = await supabase
    .from("wallets")
    .select("address");

  if (error) {
    console.error("❌ Error fetching wallets from Supabase:", error);
    return [];
  }

  return wallets.map((w: any) => w.address);
}

const ERC20_TRANSFER_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
];

async function setupStream() {
  if (!MORALIS_API_KEY) {
    console.error("❌ MORALIS_API_KEY not set. Set it in .env.local first.");
    process.exit(1);
  }

  try {
    await Moralis.start({
      apiKey: MORALIS_API_KEY,
    });

    const walletAddresses = await getWalletAddresses();
    if (walletAddresses.length === 0) {
      console.warn(
        "⚠️ No wallet addresses found in Supabase. Monitoring will be empty.",
      );
    } else {
      console.log(
        `📡 Monitoring ${walletAddresses.length} wallet addresses...`,
      );
    }

    console.log("📡 Setting up Moralis Stream via SDK...\n");
    console.log(`  Contract: ${USDT_CONTRACT}`);
    console.log(`  Webhook:  ${WEBHOOK_URL}`);

    // Check if stream already exists
    const streams = await Moralis.Streams.getAll({
      limit: 100,
    });

    let stream = streams.raw.result.find((s: any) => s.tag === "usdt-deposits");

    if (stream) {
      console.log(`♻️ Found existing stream (ID: ${stream.id}), updating...`);
      await Moralis.Streams.update({
        id: stream.id,
        webhookUrl: WEBHOOK_URL,
        description: "EdgePoint Holdings - BSC USDT Deposit Monitor",
        tag: "usdt-deposits",
        chains: [EvmChain.BSC],
        includeContractLogs: true,
        abi: ERC20_TRANSFER_ABI,
        topic0: ["Transfer(address,address,uint256)"],
        advancedOptions: [
          {
            topic0: "Transfer(address,address,uint256)",
            filter: {
              or: walletAddresses.map((addr: string) => ({
                eq: ["to", addr.toLowerCase()],
              })),
            },
          },
        ],
      });
    } else {
      console.log("🆕 Creating new stream...");
      const result = await Moralis.Streams.add({
        webhookUrl: WEBHOOK_URL,
        description: "EdgePoint Holdings - BSC USDT Deposit Monitor",
        tag: "usdt-deposits",
        chains: [EvmChain.BSC],
        includeContractLogs: true,
        abi: ERC20_TRANSFER_ABI,
        topic0: ["Transfer(address,address,uint256)"],
        advancedOptions: [
          {
            topic0: "Transfer(address,address,uint256)",
            filter: {
              or: walletAddresses.map((addr: string) => ({
                eq: ["to", addr.toLowerCase()],
              })),
            },
          },
        ],
      });
      stream = result.raw;
    }

    console.log(`✅ Stream ready! (ID: ${stream.id})`);

    // Add USDT contract address to the stream
    await Moralis.Streams.addAddress({
      id: stream.id,
      address: USDT_CONTRACT,
    });
    console.log("✅ USDT contract address added to stream.");

    // Get the webhook secret
    const settings = await Moralis.Streams.readSettings();

    console.log("\n" + "=".repeat(60));
    console.log("🔑 WEBHOOK SECRET (add to .env.local and Vercel):");
    console.log(`   ${(settings.raw as any).secretKey}`);
    console.log("=".repeat(60));

    console.log("\n📋 Next steps:");
    console.log(
      "  1. Add MORALIS_WEBHOOK_SECRET to your Vercel environment variables",
    );
    console.log("  2. Deploy the webhook endpoint to re-enable security");
    console.log("  3. Send a test USDT deposit to verify");
  } catch (error: any) {
    console.error(
      "❌ Error setting up Moralis stream:",
      error.message || error,
    );
    process.exit(1);
  }
}

setupStream();
