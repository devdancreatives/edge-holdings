-- Migration: Update transactions type constraint to include all app types
-- This fixes the issue where investment_start and profit_payout were being rejected

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN (
    'deposit', 
    'withdrawal', 
    'investment_start', 
    'profit_payout', 
    'trade_entry', 
    'trade_win', 
    'trade_loss', 
    'referral_bonus'
));
