-- Migration: Enable Row-Level Security for all tables and add standard policies
-- This resolves the "Table publicly accessible" security vulnerability.

-- 1. Enable RLS on all tables that might be missing it
ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referral_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_trades ENABLE ROW LEVEL SECURITY; -- Already done but safe

-- 2. Helper function to check if a user is an admin
-- This is used in policies to allow admins full access
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Policies for each table

-- WALLETS
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- DEPOSITS
CREATE POLICY "Users can view own deposits" ON public.deposits
    FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- ROI SNAPSHOTS
CREATE POLICY "Users can view own ROI" ON public.roi_snapshots
    FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- REFERRALS
CREATE POLICY "Users can view own referral connections" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id OR is_admin(auth.uid()));

-- REFERRAL EARNINGS
CREATE POLICY "Users can view own referral earnings" ON public.referral_earnings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.referrals 
            WHERE referrals.id = referral_id AND referrals.referrer_id = auth.uid()
        ) OR is_admin(auth.uid())
    );

-- REFERRAL BONUSES
CREATE POLICY "Users can view own referral bonuses" ON public.referral_bonuses
    FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- WITHDRAWAL REQUESTS
CREATE POLICY "Users can view/insert own withdrawal requests" ON public.withdrawal_requests
    FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- CHATS
CREATE POLICY "Users can view/insert own chats" ON public.chats
    FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- CHAT MESSAGES
CREATE POLICY "Users can view/insert messages in own chats" ON public.chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE chats.id = chat_id AND chats.user_id = auth.uid()
        ) OR is_admin(auth.uid())
    );

-- PUSH SUBSCRIPTIONS
CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions
    FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- SYSTEM CONFIGS
CREATE POLICY "Admins can manage system configs" ON public.system_configs
    FOR ALL USING (is_admin(auth.uid()));

-- VERIFICATION CODES
-- These are usually handled by service role, but let's prevent public reading
CREATE POLICY "Only service role can manage verification codes" ON public.verification_codes
    FOR ALL USING (false) WITH CHECK (false);

-- 4. Ensure Service Role always has access (Redundant as Service Role bypasses RLS, but good for clarity)
-- Note: In Supabase, the 'service_role' key bypasses RLS automatically.
