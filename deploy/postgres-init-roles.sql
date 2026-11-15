-- Run once as the administrative role in the intended new database.
-- Fixed names are deliberate. Set distinct passwords separately using psql \password.
-- Stop on any error; existing roles cause failure rather than alteration.
BEGIN;
CREATE ROLE sgi_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE sgi_backend LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
ALTER SCHEMA public OWNER TO sgi_migrator;
GRANT USAGE ON SCHEMA public TO sgi_backend;
-- Do not grant default table privileges: Prisma's migration ledger must remain private.
ALTER DEFAULT PRIVILEGES FOR ROLE sgi_migrator IN SCHEMA public REVOKE ALL ON TABLES FROM sgi_backend;
ALTER DEFAULT PRIVILEGES FOR ROLE sgi_migrator IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO sgi_backend;
COMMIT;
