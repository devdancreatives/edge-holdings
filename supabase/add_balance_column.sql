-- Migration: Add balance column to users table
-- This migration adds a balance field to track user balances

-- Add balance column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'balance'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN balance numeric(20, 6) DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- Update existing users to have 0 balance if null
UPDATE public.users 
SET balance = 0 
WHERE balance IS NULL;
