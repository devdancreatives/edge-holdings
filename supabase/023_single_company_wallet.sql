-- Migration: Single company wallet + manual deposit approval system
-- Replaces per-user HD wallet derivation with one shared USDT BEP20 address.
-- Deposits are now submitted by users and manually approved/declined by admins.

-- 1. app_settings table (stores company wallet address and other global config)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key   TEXT PRIMARY KEY,
    value TEXT,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by  UUID REFERENCES public.users(id)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read or write app_settings
CREATE POLICY "Admins manage app settings" ON public.app_settings
    FOR ALL USING (public.is_admin(auth.uid()));

-- Service role always bypasses RLS — no extra grant needed.

-- Seed the default row (admin will fill in the address via Settings page)
INSERT INTO public.app_settings (key, value)
VALUES ('company_wallet_address', '')
ON CONFLICT (key) DO NOTHING;

-- 2. Add decline_reason to deposits
ALTER TABLE public.deposits
    ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- 3. Expand status CHECK to include 'declined'
ALTER TABLE public.deposits
    DROP CONSTRAINT IF EXISTS deposits_status_check;

ALTER TABLE public.deposits
    ADD CONSTRAINT deposits_status_check
    CHECK (status IN ('pending', 'confirmed', 'failed', 'declined'));

-- 4. Track whether the deposit was user-submitted (vs auto-detected / admin-created)
ALTER TABLE public.deposits
    ADD COLUMN IF NOT EXISTS submitted_by_user BOOLEAN DEFAULT true;
