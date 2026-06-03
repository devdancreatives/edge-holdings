-- Migration: Add admin_adjustment to transactions type constraint

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
    'referral_bonus',
    'admin_adjustment'
));
