/**
 * One-time setup script to create a Moralis Stream for monitoring
 * USDT deposits on BSC to your monitored wallet addresses.
 *
 * Usage:
 *   1. Set MORALIS_API_KEY in your .env.local
 *   2. Run: npx ts-node --esm scripts/setup-moralis-stream.ts
 *   3. Copy the webhook secret from the output to your .env.local as MORALIS_WEBHOOK_SECRET
 *
 * Or set up manually via the Moralis Dashboard:
 *   1. Go to https://admin.moralis.io/streams
 *   2. Create a new Stream:
 *      - Network: BNB Chain (BSC)
 *      - Contract Address: 0x55d398326f99059fF775485246999027B3197955 (USDT)
 *      - Event: Transfer(address,address,uint256)
 *      - Webhook URL: https://edge-holdings.vercel.app/api/webhooks/moralis
 *      - Under Advanced: Add address filter for topic2 (to) matching your wallet addresses
 *   3. Copy the webhook secret from the Stream settings
 */

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

// Your monitored wallet addresses — update this list as needed
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

async function createStream() {
  if (!MORALIS_API_KEY) {
    console.error("❌ MORALIS_API_KEY not set. Set it in .env.local first.");
    process.exit(1);
  }

  console.log("📡 Creating Moralis Stream for USDT deposits on BSC...\n");
  console.log(`  Contract: ${USDT_CONTRACT}`);
  console.log(`  Webhook:  ${WEBHOOK_URL}`);
  console.log(`  Wallets:  ${WALLET_ADDRESSES.length} addresses\n`);

  try {
    // Create the stream
    const response = await fetch(
      "https://api.moralis-streams.com/streams/evm",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": MORALIS_API_KEY,
        },
        body: JSON.stringify({
          webhookUrl: WEBHOOK_URL,
          description: "EdgePoint Holdings - BSC USDT Deposit Monitor",
          tag: "usdt-deposits",
          chainIds: ["0x38"], // BSC Mainnet
          includeContractLogs: true,
          includeNativeTxs: false,
          includeInternalTxs: false,
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
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Moralis API error (${response.status}): ${errorBody}`);
    }

    const stream = await response.json();
    console.log("✅ Stream created successfully!");
    console.log(`  Stream ID: ${stream.id}`);

    // Add the USDT contract address to the stream
    const addAddressResponse = await fetch(
      `https://api.moralis-streams.com/streams/evm/${stream.id}/address`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": MORALIS_API_KEY,
        },
        body: JSON.stringify({
          address: USDT_CONTRACT,
        }),
      },
    );

    if (!addAddressResponse.ok) {
      const errorBody = await addAddressResponse.text();
      throw new Error(
        `Failed to add contract address (${addAddressResponse.status}): ${errorBody}`,
      );
    }

    console.log("✅ USDT contract address added to stream.");

    // Get the webhook secret
    const settingsResponse = await fetch(
      "https://api.moralis-streams.com/settings",
      {
        headers: {
          "x-api-key": MORALIS_API_KEY,
        },
      },
    );

    if (settingsResponse.ok) {
      const settings = await settingsResponse.json();
      console.log("\n" + "=".repeat(60));
      console.log(
        "🔑 WEBHOOK SECRET (add to .env.local as MORALIS_WEBHOOK_SECRET):",
      );
      console.log(`   ${settings.secretKey}`);
      console.log("=".repeat(60));
    } else {
      console.log(
        "\n⚠️  Could not auto-fetch webhook secret. Find it at: https://admin.moralis.io/settings",
      );
    }

    console.log("\n📋 Next steps:");
    console.log(
      "  1. Add MORALIS_WEBHOOK_SECRET to your Vercel environment variables",
    );
    console.log("  2. Deploy the webhook endpoint");
    console.log("  3. Send a test USDT deposit to verify");
  } catch (error) {
    console.error("❌ Error creating Moralis stream:", error);
    process.exit(1);
  }
}

createStream();
