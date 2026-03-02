import { createClient } from "@supabase/supabase-js";

const TRONGRID_API_URL = "https://api.trongrid.io";
const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; // Official USDT TRC20 contract
const MIN_CONFIRMATIONS = 19;

interface TronTransaction {
  transaction_id: string;
  token_info: {
    symbol: string;
    address: string;
    decimals: number;
  };
  from: string;
  to: string;
  type: string;
  value: string;
  block_timestamp: number;
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
 * Fetch recent TRC20 transactions for a wallet address
 */
export async function getWalletTransactions(
  address: string,
  limit: number = 20
): Promise<TronTransaction[]> {
  try {
    const url = `${TRONGRID_API_URL}/v1/accounts/${address}/transactions/trc20?limit=${limit}&contract_address=${USDT_CONTRACT}`;

    const headers: HeadersInit = {
      Accept: "application/json",
    };

    // Add API key if available
    if (process.env.TRONGRID_API_KEY) {
      headers["TRON-PRO-API-KEY"] = process.env.TRONGRID_API_KEY;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`TronGrid API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    return [];
  }
}

/**
 * Get transaction confirmations
 */
export async function getTransactionConfirmations(
  txHash: string
): Promise<number> {
  try {
    const url = `${TRONGRID_API_URL}/wallet/gettransactioninfobyid`;

    const headers: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (process.env.TRONGRID_API_KEY) {
      headers["TRON-PRO-API-KEY"] = process.env.TRONGRID_API_KEY;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ value: txHash }),
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();

    if (!data.blockNumber) {
      return 0;
    }

    // Get current block number
    const blockResponse = await fetch(
      `${TRONGRID_API_URL}/wallet/getnowblock`,
      {
        method: "POST",
        headers,
      }
    );

    if (!blockResponse.ok) {
      return 0;
    }

    const blockData = await blockResponse.json();
    const currentBlock = blockData.block_header?.raw_data?.number || 0;

    return currentBlock - data.blockNumber;
  } catch (error) {
    console.error("Error getting confirmations:", error);
    return 0;
  }
}

/**
 * Verify if transaction is valid USDT deposit
 */
export function verifyUSDTTransaction(
  tx: TronTransaction,
  expectedAddress: string
): boolean {
  // Check if it's USDT
  if (tx.token_info.address !== USDT_CONTRACT) {
    return false;
  }

  // Check if destination matches
  if (tx.to.toLowerCase() !== expectedAddress.toLowerCase()) {
    return false;
  }

  // Check if it's an incoming transaction (type should be 'Transfer')
  if (tx.type !== "Transfer") {
    return false;
  }

  // Check if amount is positive
  const amount = parseFloat(tx.value) / Math.pow(10, tx.token_info.decimals);
  if (amount <= 0) {
    return false;
  }

  return true;
}

/**
 * Convert TronTransaction to ProcessedTransaction
 */
export function parseTransaction(tx: TronTransaction): ProcessedTransaction {
  const amount = parseFloat(tx.value) / Math.pow(10, tx.token_info.decimals);

  return {
    txHash: tx.transaction_id,
    from: tx.from,
    to: tx.to,
    amount,
    timestamp: tx.block_timestamp,
    confirmations: 0, // Will be updated separately
  };
}

/**
 * Check if transaction already exists in database
 */
export async function transactionExists(txHash: string): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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
  return parseInt(process.env.MIN_CONFIRMATIONS || "19");
}
