-- Migration: Add optional investment_id to roi_snapshots to prevent double counting
-- and support direct profit adjustment per investment.

ALTER TABLE public.roi_snapshots 
    ADD COLUMN IF NOT EXISTS investment_id UUID REFERENCES public.investments(id) ON DELETE CASCADE;

-- Create an index to speed up lookups by investment_id
CREATE INDEX IF NOT EXISTS roi_snapshots_investment_id_idx ON public.roi_snapshots(investment_id);
