import Moralis from "moralis";

// ─── Internal helpers ─────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Cache the stream ID for the lifetime of the process to avoid repeated getAll() calls. */
let _cachedStreamId: string | null = null;

async function getStreamId(): Promise<string | null> {
  if (_cachedStreamId) return _cachedStreamId;

  const streams = await Moralis.Streams.getAll({ limit: 100 });
  const stream = streams.raw.result.find((s: any) => s.tag === "usdt-deposits");

  if (!stream) {
    console.error(
      "[MORALIS] Stream with tag 'usdt-deposits' not found. " +
        "Please create it in the Moralis dashboard and restart the server.",
    );
    return null;
  }

  _cachedStreamId = stream.id as string;
  return _cachedStreamId;
}

async function ensureStarted(): Promise<boolean> {
  const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
  if (!MORALIS_API_KEY) {
    console.warn("[MORALIS] MORALIS_API_KEY is missing — cannot use Streams API.");
    return false;
  }
  if (!Moralis.Core.isStarted) {
    await Moralis.start({ apiKey: MORALIS_API_KEY });
  }
  return true;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface StreamAddResult {
  success: boolean;
  /** Already existed in the stream before this call. */
  alreadyRegistered?: boolean;
  streamId?: string;
  address: string;
  attempts: number;
  error?: string;
}

/**
 * Add a wallet address to the 'usdt-deposits' Moralis Stream.
 *
 * Features:
 * - Retries up to 3 times with exponential backoff on transient errors.
 * - Skips silently if the address is already registered (idempotent).
 * - Returns a structured result so callers can decide how to handle failure.
 * - Never throws — safe to use in fire-and-forget contexts.
 *
 * @param address  BSC wallet address to register
 * @param maxRetries  Number of retry attempts (default 3)
 */
export async function addAddressToMoralisStream(
  address: string,
  maxRetries = 3,
): Promise<StreamAddResult> {
  const result: StreamAddResult = { success: false, address, attempts: 0 };

  try {
    const started = await ensureStarted();
    if (!started) {
      result.error = "MORALIS_API_KEY not configured";
      return result;
    }

    const streamId = await getStreamId();
    if (!streamId) {
      result.error = "usdt-deposits stream not found on Moralis";
      return result;
    }
    result.streamId = streamId;

    // ── Retry loop ─────────────────────────────────────────────────────────
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      result.attempts = attempt;

      try {
        await Moralis.Streams.addAddress({ id: streamId, address });
        result.success = true;
        console.log(
          `[MORALIS] ✅ Added ${address} to stream ${streamId} (attempt ${attempt})`,
        );
        return result;
      } catch (err: any) {
        lastError = err;

        // Moralis returns a 400/conflict when the address is already present.
        // Treat this as success — the address IS monitored, which is what we want.
        const msg: string = err?.message ?? String(err);
        if (
          msg.toLowerCase().includes("already") ||
          msg.toLowerCase().includes("duplicate") ||
          err?.status === 400
        ) {
          result.success = true;
          result.alreadyRegistered = true;
          console.log(`[MORALIS] ℹ️  ${address} is already registered in stream ${streamId}`);
          return result;
        }

        // Transient error — wait before retrying
        if (attempt < maxRetries) {
          const delay = 500 * Math.pow(2, attempt - 1); // 500ms, 1s, 2s
          console.warn(
            `[MORALIS] ⚠️  Attempt ${attempt}/${maxRetries} failed for ${address}: ${msg}. Retrying in ${delay}ms…`,
          );
          await sleep(delay);
        }
      }
    }

    // All retries exhausted
    const errMsg =
      (lastError as any)?.message ?? String(lastError) ?? "Unknown error";
    result.error = errMsg;
    console.error(
      `[MORALIS] ❌ Permanently failed to add ${address} after ${maxRetries} attempts: ${errMsg}`,
    );
    return result;
  } catch (err: any) {
    // Outer catch — e.g. ensureStarted or getStreamId threw unexpectedly
    result.error = err?.message ?? String(err);
    console.error("[MORALIS] ❌ Unexpected error in addAddressToMoralisStream:", err);
    return result;
  }
}
