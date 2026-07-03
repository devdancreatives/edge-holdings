-- Migration: Dynamic investment plans managed by admin
-- Create public.investment_plans table

CREATE TABLE IF NOT EXISTS public.investment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    duration_months INTEGER NOT NULL CHECK (duration_months >= 0),
    roi_rate NUMERIC(10, 4) NOT NULL CHECK (roi_rate >= 0),
    min_amount NUMERIC(20, 6) DEFAULT 500 NOT NULL CHECK (min_amount >= 0),
    plan_type TEXT DEFAULT 'standard' NOT NULL CHECK (plan_type IN ('standard', 'PIF')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;

-- Select policy: any authenticated user
CREATE POLICY "Anyone can select active plans" ON public.investment_plans
    FOR SELECT USING (is_active = true OR public.is_admin(auth.uid()));

-- Admin policy: all permissions for admin
CREATE POLICY "Admins can manage plans" ON public.investment_plans
    FOR ALL USING (public.is_admin(auth.uid()));

-- Seed standard default plans for historical compatibility
INSERT INTO public.investment_plans (name, duration_months, roi_rate, min_amount, plan_type)
VALUES 
('Basic 1 Month Plan', 1, 2.0000, 500, 'standard'),
('Standard 2 Months Plan', 2, 4.0000, 500, 'standard'),
('Gold 3 Months Plan', 3, 6.0000, 500, 'standard'),
('Premium 6 Months Plan', 6, 12.0000, 500, 'standard')
ON CONFLICT DO NOTHING;
