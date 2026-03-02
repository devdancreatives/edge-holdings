-- Migration: Add referral system
-- This migration adds tables and columns for the referral system

-- Add referral columns to users table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'referral_code'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN referral_code text UNIQUE,
        ADD COLUMN referred_by uuid REFERENCES public.users(id),
        ADD COLUMN referral_earnings numeric(20, 6) DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id uuid REFERENCES public.users(id) NOT NULL,
  referee_id uuid REFERENCES public.users(id) NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  total_earned numeric(20, 6) DEFAULT 0 NOT NULL,
  CONSTRAINT no_self_referral CHECK (referrer_id != referee_id)
);

-- Create referral_earnings table
CREATE TABLE IF NOT EXISTS public.referral_earnings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  referral_id uuid REFERENCES public.referrals(id) NOT NULL,
  investment_id uuid REFERENCES public.investments(id) NOT NULL,
  amount numeric(20, 6) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create referral_bonuses table for milestone rewards
CREATE TABLE IF NOT EXISTS public.referral_bonuses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) NOT NULL,
  milestone integer NOT NULL, -- 5, 10, 25, 50, 100 referrals
  bonus_amount numeric(20, 6) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, milestone)
);

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) NOT NULL,
  amount numeric(20, 6) NOT NULL,
  wallet_address text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  tx_hash text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  processed_at timestamp with time zone,
  notes text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON public.referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referral ON public.referral_earnings(referral_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.users WHERE referral_code = code) INTO exists;
    
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to credit referral earnings
CREATE OR REPLACE FUNCTION credit_referral_earnings(
  p_investment_id uuid,
  p_investment_amount numeric
)
RETURNS void AS $$
DECLARE
  v_referee_id uuid;
  v_referrer_id uuid;
  v_referral_id uuid;
  v_commission numeric;
BEGIN
  -- Get the investor (referee)
  SELECT user_id INTO v_referee_id
  FROM public.investments
  WHERE id = p_investment_id;
  
  -- Check if user was referred
  SELECT referrer_id, id INTO v_referrer_id, v_referral_id
  FROM public.referrals
  WHERE referee_id = v_referee_id;
  
  IF v_referrer_id IS NOT NULL THEN
    -- Calculate 0.5% commission
    v_commission := p_investment_amount * 0.005;
    
    -- Credit referrer's balance
    UPDATE public.users
    SET referral_earnings = COALESCE(referral_earnings, 0) + v_commission
    WHERE id = v_referrer_id;
    
    -- Update total earned in referrals table
    UPDATE public.referrals
    SET total_earned = COALESCE(total_earned, 0) + v_commission
    WHERE id = v_referral_id;
    
    -- Create earnings record
    INSERT INTO public.referral_earnings (referral_id, investment_id, amount)
    VALUES (v_referral_id, p_investment_id, v_commission);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check and award referral bonuses
CREATE OR REPLACE FUNCTION check_referral_bonuses(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_referral_count integer;
  v_milestone integer;
  v_bonus_amount numeric;
BEGIN
  -- Count total referrals
  SELECT COUNT(*) INTO v_referral_count
  FROM public.referrals
  WHERE referrer_id = p_user_id;
  
  -- Check milestones: 5, 10, 25, 50, 100
  FOR v_milestone IN SELECT unnest(ARRAY[5, 10, 25, 50, 100])
  LOOP
    IF v_referral_count >= v_milestone THEN
      -- Check if bonus already awarded
      IF NOT EXISTS (
        SELECT 1 FROM public.referral_bonuses
        WHERE user_id = p_user_id AND milestone = v_milestone
      ) THEN
        -- Calculate bonus: $10 * milestone
        v_bonus_amount := v_milestone * 10;
        
        -- Award bonus
        INSERT INTO public.referral_bonuses (user_id, milestone, bonus_amount)
        VALUES (p_user_id, v_milestone, v_bonus_amount);
        
        -- Credit user's referral earnings
        UPDATE public.users
        SET referral_earnings = COALESCE(referral_earnings, 0) + v_bonus_amount
        WHERE id = p_user_id;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate referral codes for existing users
UPDATE public.users
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;
