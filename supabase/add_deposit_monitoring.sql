-- Migration: Add deposit monitoring fields
-- This migration adds fields needed for tracking deposit confirmations and monitoring

-- Add confirmations column to deposits table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'deposits' 
        AND column_name = 'confirmations'
    ) THEN
        ALTER TABLE public.deposits 
        ADD COLUMN confirmations integer DEFAULT 0;
    END IF;
END $$;

-- Add last_checked_at column to deposits table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'deposits' 
        AND column_name = 'last_checked_at'
    ) THEN
        ALTER TABLE public.deposits 
        ADD COLUMN last_checked_at timestamp with time zone;
    END IF;
END $$;

-- Add confirmed_at column to deposits table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'deposits' 
        AND column_name = 'confirmed_at'
    ) THEN
        ALTER TABLE public.deposits 
        ADD COLUMN confirmed_at timestamp with time zone;
    END IF;
END $$;

-- Create index on tx_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_deposits_tx_hash ON public.deposits(tx_hash);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(status);

-- Create function to increment user balance
CREATE OR REPLACE FUNCTION increment_balance(user_id uuid, amount numeric)
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET balance = COALESCE(balance, 0) + amount
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
