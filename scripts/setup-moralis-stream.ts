import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

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

// Your monitored wallet addresses
const WALLET_ADDRESSES = [
  "0x635aB8aD55b6920E2E6Eb4d56F238b990CFa3D42",
  "0x35638B6940b0AAdf2E01046C69eCC6A986925ab2",
  "0x7985f793DA45a53f5BECbCf24bC1b4edDc263541",
  "0x444F35a614bAA60d804055DE6121DC4d61b9586D",
];

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
        chainIds: [EvmChain.BSC],
        includeContractLogs: true,
        abi: ERC20_TRANSFER_ABI,
        topic0: ["Transfer(address,address,uint256)"],
        advancedOptions: [
          {
            topic0: "Transfer(address,address,uint256)",
            filter: {
              or: WALLET_ADDRESSES.map((addr) => ({
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
              or: WALLET_ADDRESSES.map((addr) => ({
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
    const settings = await Moralis.Streams.getSettings();

    console.log("\n" + "=".repeat(60));
    console.log("🔑 WEBHOOK SECRET (add to .env.local and Vercel):");
    console.log(`   ${settings.raw.secretKey}`);
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
