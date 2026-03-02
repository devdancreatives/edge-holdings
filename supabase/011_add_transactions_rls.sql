-- Migration: Add RLS policies for the transactions table

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' AND policyname = 'Users can view their own transactions'
    ) THEN
        CREATE POLICY "Users can view their own transactions" 
        ON public.transactions FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    -- Policy: Admins can view all transactions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' AND policyname = 'Admins can view all transactions'
    ) THEN
        CREATE POLICY "Admins can view all transactions" 
        ON public.transactions FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() AND users.role = 'admin'
            )
        );
    END IF;

    -- Note: Insert/Update/Delete should generally be handled by service role or specific triggers, 
    -- but if the app inserts directly, we might need an INSERT policy.
    -- Based on the resolvers, the app DOES insert directly using the client.
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' AND policyname = 'Users can insert their own transactions'
    ) THEN
        CREATE POLICY "Users can insert their own transactions" 
        ON public.transactions FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;

END $$;
