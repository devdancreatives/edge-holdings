-- Add the missing 'fee' column to the investments table
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS fee numeric(20, 6) DEFAULT 0;

-- While we are here, double check that RLS is properly set up for investments
-- If it's already enabled and has policies, this will be safe.
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'investments' AND policyname = 'Users can view their own investments'
    ) THEN
        CREATE POLICY "Users can view their own investments" 
        ON public.investments FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'investments' AND policyname = 'Users can insert their own investments'
    ) THEN
        CREATE POLICY "Users can insert their own investments" 
        ON public.investments FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'investments' AND policyname = 'Users can update their own investments'
    ) THEN
        CREATE POLICY "Users can update their own investments" 
        ON public.investments FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;
END $$;
