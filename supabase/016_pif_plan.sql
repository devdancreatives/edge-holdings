-- Migration to support different plan types and custom ROI rates
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'standard';
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS roi_rate numeric(10, 4);

-- Set existing investments to a default ROI rate of 7% (0.07) for historical consistency
-- although new ones will use 25% (0.25)
UPDATE public.investments SET roi_rate = 0.07 WHERE roi_rate IS NULL;
