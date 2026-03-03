-- Optimized BSC Deposit Monitoring Migration
-- This migration adds state tracking and atomic processing for blockchain deposits

-- 1. Create System Config Table for Block Tracking
CREATE TABLE IF NOT EXISTS public.system_configs (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Initialize BSC block tracker if it doesn't exist
-- Using a recent block height as default (will be overwritten by first scan)
INSERT INTO public.system_configs (key, value)
VALUES ('last_bsc_block', '46000000') 
ON CONFLICT (key) DO NOTHING;

-- 2. Atomic Deposit Processing Function
-- This function handles everything in a single DB transaction:
-- - Inserts or updates the deposit record
-- - Increments user balance (only if transiting to 'confirmed')
-- - Logs a record in the transactions ledger
CREATE OR REPLACE FUNCTION public.process_bsc_deposit(
    p_user_id UUID,
    p_amount NUMERIC,
    p_tx_hash TEXT,
    p_status TEXT,
    p_confirmations INTEGER
) RETURNS VOID AS $$
DECLARE
    v_existing_status TEXT;
BEGIN
    -- 0. Use transaction-level advisory lock on tx_hash decimal representation to prevent race conditions
    -- tx_hash is hex, we take first 8 chars and convert to int for the lock key
    PERFORM pg_advisory_xact_lock(hashtext(p_tx_hash));

    -- Get current status if it exists
    SELECT status INTO v_existing_status FROM public.deposits WHERE tx_hash = p_tx_hash;

    -- 1. Upsert deposit record
    INSERT INTO public.deposits (user_id, amount, tx_hash, status, confirmations, last_checked_at, confirmed_at)
    VALUES (
        p_user_id, 
        p_amount, 
        p_tx_hash, 
        p_status, 
        p_confirmations, 
        now(),
        CASE WHEN p_status = 'confirmed' THEN now() ELSE NULL END
    )
    ON CONFLICT (tx_hash) DO UPDATE SET
        status = EXCLUDED.status,
        confirmations = EXCLUDED.confirmations,
        last_checked_at = EXCLUDED.last_checked_at,
        confirmed_at = CASE WHEN EXCLUDED.status = 'confirmed' AND (deposits.status IS NULL OR deposits.status != 'confirmed') THEN now() ELSE deposits.confirmed_at END;

    -- 2. If it's a NEW confirmation, update transactions ledger
    -- User balance is calculated dynamically via getAvailableBalance in the app
    IF p_status = 'confirmed' AND (v_existing_status IS NULL OR v_existing_status != 'confirmed') THEN
        -- Log in general ledger
        INSERT INTO public.transactions (user_id, type, amount, description)
        VALUES (
            p_user_id, 
            'deposit', 
            p_amount, 
            format('USDT deposit (BSC) - %s...', substring(p_tx_hash from 1 for 10))
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
