import { ethers } from "ethers";
import { createClient } from "@supabase/supabase-js";

const BSCSCAN_API_URL = "https://api.etherscan.io/v2/api";
const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955"; // BSC-USD (BEP20)
const MIN_CONFIRMATIONS = 15;
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"; // Transfer(address,address,uint256)
const BSC_RPC_URL = "https://bsc-dataseed.binance.org/";

// Reuse a single provider to avoid repeated TCP/TLS connection setup
let _providerInstance: ethers.JsonRpcProvider | null = null;
function getProvider(): ethers.JsonRpcProvider {
  if (!_providerInstance) {
    _providerInstance = new ethers.JsonRpcProvider(BSC_RPC_URL);
  }
  return _providerInstance;
}

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
 * Helper: Extract a proper checksummed address from a 32-byte log topic.
 * Topics are zero-padded to 32 bytes; the actual address is the last 20 bytes.
 */
function addressFromTopic(topic: string): string {
  return ethers.getAddress("0x" + topic.slice(26));
}

/**
 * Fetch recent BEP20 transactions for a wallet address from RPC (ethers)
 * This replaces the paid BscScan API.
 */
export async function getWalletTransactions(
  address: string,
  _limit: number = 20,
): Promise<BscScanTransaction[]> {
  try {
    const provider = getProvider();

    // Filter for Transfer event to 'address' on USDT contract
    const topicTo = ethers.zeroPadValue(address, 32);
    const transferTopic = TRANSFER_TOPIC;

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

        // Extract 'from' address from topic[1]
        const fromAddress =
          log.topics && log.topics[1]
            ? addressFromTopic(log.topics[1])
            : "0x0000000000000000000000000000000000000000";

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
    return transactions.sort(
      (a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp),
    );
  } catch (error) {
    console.error("Error fetching wallet transactions via RPC:", error);
    return [];
  }
}

/**
 * Fetch USDT transfer logs for a block range, filtered to specific wallet addresses.
 * Only returns transfers TO one of the provided addresses.
 * Automatically fragments requests if block range is too large or if RPC limits are hit.
 */
export async function getGlobalTransactions(
  fromBlock: number,
  toBlock: number,
  walletAddresses?: string[],
): Promise<BscScanTransaction[]> {
  const MAX_BLOCKS_PER_CHUNK = 5000;

  try {
    const provider = getProvider();

    // If block range is too large, split and recurse
    if (toBlock - fromBlock > MAX_BLOCKS_PER_CHUNK) {
      console.log(`Range ${fromBlock}-${toBlock} too large, splitting...`);
      const mid = Math.floor((fromBlock + toBlock) / 2);
      const [part1, part2] = await Promise.all([
        getGlobalTransactions(fromBlock, mid, walletAddresses),
        getGlobalTransactions(mid + 1, toBlock, walletAddresses),
      ]);
      return [...part1, ...part2];
    }

    console.log(`Scanning BSC logs from ${fromBlock} to ${toBlock}...`);

    // Build topics filter:
    // topic[0] = Transfer event signature
    // topic[1] = from (null = any sender)
    // topic[2] = to (filter to our wallets if provided)
    const toFilter =
      walletAddresses && walletAddresses.length > 0
        ? walletAddresses.map((addr) => ethers.zeroPadValue(addr, 32))
        : null;

    let logs;
    try {
      logs = await provider.getLogs({
        address: USDT_CONTRACT,
        topics: [TRANSFER_TOPIC, null, toFilter],
        fromBlock,
        toBlock,
      });
    } catch (rpcError: any) {
      // If we hit "limit exceeded" or similar, split more aggressively
      if (
        rpcError.message?.includes("limit exceeded") ||
        rpcError.message?.includes("too many results") ||
        toBlock - fromBlock > 1
      ) {
        console.warn(
          `RPC Limit hit for range ${fromBlock}-${toBlock}, splitting...`,
        );
        const mid = Math.floor((fromBlock + toBlock) / 2);
        const [part1, part2] = await Promise.all([
          getGlobalTransactions(fromBlock, mid, walletAddresses),
          getGlobalTransactions(mid + 1, toBlock, walletAddresses),
        ]);
        return [...part1, ...part2];
      }
      throw rpcError;
    }

    if (logs.length === 0) return [];

    console.log(
      `Found ${logs.length} USDT transfers to monitored wallets in ${fromBlock}-${toBlock}.`,
    );

    // Get current block for confirmation calculation
    const currentBlock = await provider.getBlockNumber();

    // Fetch block timestamps for all unique blocks in parallel
    const uniqueBlockNumbers = [...new Set(logs.map((l) => l.blockNumber))];
    const blockMap = new Map<number, number>();
    const blockResults = await Promise.all(
      uniqueBlockNumbers.map((bn) => provider.getBlock(bn)),
    );
    for (const block of blockResults) {
      if (block) blockMap.set(block.number, block.timestamp);
    }

    // Map logs to BscScanTransaction format
    const transactions: BscScanTransaction[] = logs.map((log) => {
      const amount = BigInt(log.data).toString();

      const fromAddress =
        log.topics && log.topics[1]
          ? addressFromTopic(log.topics[1])
          : "0x0000000000000000000000000000000000000000";

      const toAddress =
        log.topics && log.topics[2]
          ? addressFromTopic(log.topics[2])
          : "0x0000000000000000000000000000000000000000";

      const blockTimestamp =
        blockMap.get(log.blockNumber) || Math.floor(Date.now() / 1000);
      const confirmations = currentBlock - log.blockNumber;

      return {
        hash: log.transactionHash,
        from: fromAddress,
        to: toAddress,
        value: amount,
        timeStamp: blockTimestamp.toString(),
        tokenSymbol: "USDT",
        tokenDecimal: "18",
        contractAddress: USDT_CONTRACT,
        confirmations: confirmations.toString(),
      };
    });

    return transactions;
  } catch (error) {
    console.error(
      `Error in getGlobalTransactions (${fromBlock}-${toBlock}):`,
      error,
    );
    return [];
  }
}

/**
 * Get current block number
 */
export async function getCurrentBlockNumber(): Promise<number> {
  try {
    const provider = getProvider();
    return await provider.getBlockNumber();
  } catch (error) {
    console.error("Error getting current block:", error);
    return 0;
  }
}

/**
 * Get transaction confirmations (BSC specific)
 */
export async function getTransactionConfirmations(
  txHash: string,
): Promise<number> {
  try {
    const provider = getProvider();
    const [tx, currentBlock] = await Promise.all([
      provider.getTransaction(txHash),
      provider.getBlockNumber(),
    ]);

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
