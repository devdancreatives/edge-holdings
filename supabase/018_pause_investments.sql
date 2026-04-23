-- Add columns to handle pausing investments
ALTER TABLE public.investments
ADD COLUMN is_paused boolean DEFAULT false NOT NULL,
ADD COLUMN paused_at timestamp with time zone;
