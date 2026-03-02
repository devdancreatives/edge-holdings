-- Migration: Close all active investments and record principal return transactions
-- This script will mark all 'active' investments as 'completed'
-- and create a ledger entry to show the money was returned.

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Loop through all active investments
    FOR r IN SELECT id, user_id, amount FROM public.investments WHERE status = 'active'
    LOOP
        -- 1. Mark the investment as completed
        -- This automatically restores 'Available Balance' in the app calculation
        UPDATE public.investments 
        SET status = 'completed' 
        WHERE id = r.id;
        
        -- 2. Log the transaction as a 'deposit' (proxy for credit)
        -- This ensures the user sees why their balance went up in their history
        INSERT INTO public.transactions (user_id, amount, type, description)
        VALUES (
            r.user_id, 
            r.amount, 
            'deposit', 
            'Investment closed by admin - Principal returned'
        );
    END LOOP;
END $$;
