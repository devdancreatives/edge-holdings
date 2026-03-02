-- Migration: Jump BSC block tracker to current tip
-- Current block is around 84,283,324. We'll set it to 84,280,000 to catch very recent transactions.

UPDATE public.system_configs 
SET value = '"84280000"',
    updated_at = now()
WHERE key = 'last_bsc_block';
