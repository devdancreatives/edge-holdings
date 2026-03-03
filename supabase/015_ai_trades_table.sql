-- Migration: Create ai_trades table for server-side trade outcome tracking
-- This prevents the critical exploit where clients could forge win/loss results

-- 1. Create ai_trades table
CREATE TABLE IF NOT EXISTS public.ai_trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    stake NUMERIC(20, 6) NOT NULL CHECK (stake > 0),
    direction TEXT NOT NULL CHECK (direction IN ('UP', 'DOWN')),
    outcome TEXT NOT NULL CHECK (outcome IN ('WIN', 'LOSS')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'expired')),
    profit NUMERIC(20, 6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_ai_trades_user_status ON public.ai_trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_trades_created ON public.ai_trades(created_at);

-- 3. Constraint: Only 1 pending trade per user (prevents spam/race conditions)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_trades_one_pending 
ON public.ai_trades(user_id) WHERE status = 'pending';

-- 4. RLS
ALTER TABLE public.ai_trades ENABLE ROW LEVEL SECURITY;

-- Users can only see their own trades
CREATE POLICY "Users can view own trades" ON public.ai_trades
    FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update (prevents direct client manipulation)
CREATE POLICY "Service role full access" ON public.ai_trades
    FOR ALL USING (auth.role() = 'service_role');
