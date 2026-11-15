-- Run as administrative role against a disposable database after migrations/grants.
DO $$
BEGIN
 IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='sgi_backend' AND rolcanlogin AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication AND NOT rolbypassrls) THEN RAISE EXCEPTION 'backend role unsafe'; END IF;
 IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='sgi_migrator' AND rolcanlogin AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication AND NOT rolbypassrls) THEN RAISE EXCEPTION 'migration role unsafe'; END IF;
 IF pg_has_role('sgi_backend','sgi_migrator','MEMBER') THEN RAISE EXCEPTION 'backend inherits migration role'; END IF;
 IF has_schema_privilege('sgi_backend','public','CREATE') THEN RAISE EXCEPTION 'backend can create'; END IF;
 IF has_table_privilege('sgi_backend','public."_prisma_migrations"','INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN RAISE EXCEPTION 'ledger writable'; END IF;
 IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','S') AND pg_get_userbyid(c.relowner) <> 'sgi_migrator') THEN RAISE EXCEPTION 'unexpected owner'; END IF;
 IF NOT has_table_privilege('sgi_backend','public."User"','SELECT,INSERT,UPDATE,DELETE') THEN RAISE EXCEPTION 'runtime grants missing'; END IF;
END $$;
