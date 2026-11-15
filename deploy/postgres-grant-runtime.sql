-- Run as sgi_migrator after every successful migration while backend is stopped.
-- Grant only application tables; never grant the Prisma migration ledger.
BEGIN;
DO $$
DECLARE item record;
BEGIN
  FOR item IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind IN ('r','p','v')
      AND c.relname <> '_prisma_migrations'
      AND pg_get_userbyid(c.relowner)=current_user
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO sgi_backend', item.relname);
  END LOOP;
END $$;
REVOKE ALL ON TABLE public."_prisma_migrations" FROM PUBLIC, sgi_backend;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sgi_backend;
COMMIT;
