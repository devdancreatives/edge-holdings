-- Migration: Update investments_duration_months_check to allow 0 (for hourly test investments)

-- Find the existing constraint name (usually it's investments_duration_months_check)
-- Drop the existing constraint and add the new one that allows 0.

ALTER TABLE public.investments 
DROP CONSTRAINT IF EXISTS investments_duration_months_check;

ALTER TABLE public.investments 
ADD CONSTRAINT investments_duration_months_check 
CHECK (duration_months >= 0 AND duration_months <= 6);
