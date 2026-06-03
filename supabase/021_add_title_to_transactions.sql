-- Migration: Add title column to transactions table
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS title text;
