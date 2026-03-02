import { ethers } from "ethers";
import { createClient } from "@supabase/supabase-js";

const BSCSCAN_API_URL = "https://api.etherscan.io/v2/api";
const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955"; // BSC-USD
const MIN_CONFIRMATIONS = 15;

// Interface for BscScan transaction
export interface BscScanTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  tokenSymbol: string;
  tokenDecimal: string;
  contractAddress: string;
  confirmations: string;
}

interface ProcessedTransaction {
  txHash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  confirmations: number;
}

/**
 * Fetch recent BEP20 transactions for a wallet address from BscScan
 */
/**
 * Fetch recent BEP20 transactions for a wallet address from RPC (ethers)
 * This replaces the paid BscScan API.
 */
export async function getWalletTransactions(
  address: string,
  _limit: number = 20, // limit is less relevant for block range, but we keep signature
): Promise<BscScanTransaction[]> {
  try {
    const provider = new ethers.JsonRpcProvider(
      "https://bsc-dataseed.binance.org/",
    );

    // Filter for Transfer event to 'address' on USDT contract
    const topicTo = ethers.zeroPadValue(address, 32);
    const transferTopic =
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"; // Transfer(address,address,uint256)

    // Get current block
    const currentBlock = await provider.getBlockNumber();
    // Look back ~2 hours (2400 blocks at 3s/block) to be safe
    const fromBlock = currentBlock - 2400;

    const logs = await provider.getLogs({
      address: USDT_CONTRACT,
      topics: [transferTopic, null, topicTo],
      fromBlock,
      toBlock: "latest",
    });

    // Map logs to BscScanTransaction format
    const transactions: BscScanTransaction[] = await Promise.all(
      logs.map(async (log) => {
        const block = await provider.getBlock(log.blockNumber);

        // Decode amount (value)
        const amount = BigInt(log.data).toString();

        // Extract 'from' address from topic[1] (if present)
        let fromAddress = "0x";
        if (log.topics && log.topics[1]) {
          fromAddress = ethers.stripZerosLeft(log.topics[1]);
        }

        return {
          hash: log.transactionHash,
          from: fromAddress,
          to: address,
          value: amount,
          timeStamp: block
            ? block.timestamp.toString()
            : Math.floor(Date.now() / 1000).toString(),
          tokenSymbol: "USDT",
          tokenDecimal: "18",
          contractAddress: USDT_CONTRACT,
          confirmations: (currentBlock - log.blockNumber).toString(),
        };
      }),
    );

    // Sort valid transactions descending by timestamp
    // Filter out nulls if any block fetch failed (unlikely)
    return transactions.sort(
      (a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp),
    );
  } catch (error) {
    console.error("Error fetching wallet transactions via RPC:", error);
    return [];
  }
}

/**
 * Fetch all USDT transfer logs for a block range.
 * High-performance scanning for multiple users.
 */
export async function getGlobalTransactions(
  fromBlock: number,
  toBlock: number,
): Promise<BscScanTransaction[]> {
  try {
    const provider = new ethers.JsonRpcProvider(
      "https://bsc-dataseed.binance.org/",
    );

    const transferTopic =
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

    console.log(`Scanning BSC logs from ${fromBlock} to ${toBlock}...`);

    const logs = await provider.getLogs({
      address: USDT_CONTRACT,
      topics: [transferTopic],
      fromBlock,
      toBlock,
    });

    if (logs.length === 0) return [];

    console.log(`Found ${logs.length} USDT transfers in range.`);

    // Map logs to BscScanTransaction format
    const transactions: BscScanTransaction[] = logs.map((log) => {
      // Decode amount (value) from data
      const amount = BigInt(log.data).toString();

      // Extract 'from' address from topic[1]
      let fromAddress = "0x";
      if (log.topics && log.topics[1]) {
        fromAddress = ethers.stripZerosLeft(log.topics[1]);
      }

      // Extract 'to' address from topic[2]
      let toAddress = "0x";
      if (log.topics && log.topics[2]) {
        toAddress = ethers.stripZerosLeft(log.topics[2]);
      }

      return {
        hash: log.transactionHash,
        from: fromAddress,
        to: toAddress,
        value: amount,
        timeStamp: Math.floor(Date.now() / 1000).toString(), // Will be approximate for batch
        tokenSymbol: "USDT",
        tokenDecimal: "18",
        contractAddress: USDT_CONTRACT,
        confirmations: "0", // Handled by caller or post-processing
      };
    });

    return transactions;
  } catch (error) {
    console.error("Error fetching global transactions via RPC:", error);
    return [];
  }
}

/**
 * Get current block number
 */
export async function getCurrentBlockNumber(): Promise<number> {
  try {
    const provider = new ethers.JsonRpcProvider(
      "https://bsc-dataseed.binance.org/",
    );
    return await provider.getBlockNumber();
  } catch (error) {
    console.error("Error getting current block:", error);
    return 0;
  }
}

/**
 * Get transaction confirmations (BSC specific)
 * BscScan includes confirmations in the transaction list endpoint,
 * but for specific tx logic we might just query the tx status or trusted RPC.
 * This function mimics the previous interface.
 */
export async function getTransactionConfirmations(
  txHash: string,
): Promise<number> {
  try {
    // We can use ethers to get standard provider confirmations
    // or query BscScan again. Cost-effective way is RPC.
    // Using public RPC for BSC
    const provider = new ethers.JsonRpcProvider(
      "https://bsc-dataseed.binance.org/",
    );
    const tx = await provider.getTransaction(txHash);
    const currentBlock = await provider.getBlockNumber();

    if (tx && tx.blockNumber) {
      return currentBlock - tx.blockNumber;
    }
    return 0;
  } catch (error) {
    console.error("Error getting confirmations:", error);
    // Fallback to BscScan logic if RPC fails?
    // For now return 0 to be safe.
    return 0;
  }
}

/**
 * Verify if transaction is valid USDT deposit
 */
export function verifyUSDTTransaction(
  tx: BscScanTransaction,
  expectedAddress: string,
): boolean {
  // Check if it's USDT contract
  if (tx.contractAddress.toLowerCase() !== USDT_CONTRACT.toLowerCase()) {
    return false;
  }

  // Check if destination matches (case insensitive for EVM)
  if (tx.to.toLowerCase() !== expectedAddress.toLowerCase()) {
    return false;
  }

  // Check if amount is positive
  const decimals = parseInt(tx.tokenDecimal);
  const amount = parseFloat(tx.value) / Math.pow(10, decimals);

  if (amount <= 0) {
    return false;
  }

  return true;
}

/**
 * Convert BscScanTransaction to ProcessedTransaction
 */
export function parseTransaction(tx: BscScanTransaction): ProcessedTransaction {
  const decimals = parseInt(tx.tokenDecimal);
  const amount = parseFloat(tx.value) / Math.pow(10, decimals);

  return {
    txHash: tx.hash,
    from: tx.from,
    to: tx.to,
    amount,
    timestamp: parseInt(tx.timeStamp) * 1000, // timestamp is usually in seconds
    confirmations: parseInt(tx.confirmations),
  };
}

/**
 * Check if transaction already exists in database
 */
export async function transactionExists(txHash: string): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data } = await supabase
    .from("deposits")
    .select("id")
    .eq("tx_hash", txHash)
    .single();

  return !!data;
}

/**
 * Get minimum required confirmations
 */
export function getMinConfirmations(): number {
  return parseInt(process.env.BSC_MIN_CONFIRMATIONS || "15");
}
