-- Update transactions type constraint to allow trading and referral types
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('deposit', 'withdrawal', 'trade_entry', 'trade_win', 'trade_loss', 'referral_bonus'));
