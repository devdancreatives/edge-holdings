-- Migration: Replace manual path_index tracking with a PostgreSQL sequence
-- This prevents race conditions where two concurrent wallet creations both
-- read the same max(path_index) and collide on the UNIQUE constraint.

-- 1. Create a dedicated sequence starting at the current max path_index + 1
DO $$
DECLARE
    v_max_index integer;
BEGIN
    SELECT COALESCE(MAX(path_index), 0) INTO v_max_index FROM public.wallets;
    EXECUTE format(
        'CREATE SEQUENCE IF NOT EXISTS public.wallet_path_index_seq START WITH %s INCREMENT BY 1 MINVALUE 1 NO CYCLE',
        v_max_index + 1
    );
END $$;

-- 2. Set the default on the column to use the sequence
ALTER TABLE public.wallets
    ALTER COLUMN path_index SET DEFAULT nextval('public.wallet_path_index_seq');

-- 3. Grant usage on the sequence to the service role (already implicit, but explicit is safer)
GRANT USAGE, SELECT ON SEQUENCE public.wallet_path_index_seq TO service_role;

-- 4. Expose a simple RPC so the app can atomically claim the next index
--    without needing raw SQL access.
CREATE OR REPLACE FUNCTION public.nextval_wallet_path_index()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT nextval('public.wallet_path_index_seq');
$$;

GRANT EXECUTE ON FUNCTION public.nextval_wallet_path_index() TO service_role;
