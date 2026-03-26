-- Migration: Add last_payout_date to track daily interest payouts
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS last_payout_date TIMESTAMP WITH TIME ZONE;

-- Initialize last_payout_date for existing investments
-- For active investments, we start from their start_date
UPDATE public.investments 
SET last_payout_date = start_date 
WHERE last_payout_date IS NULL;
