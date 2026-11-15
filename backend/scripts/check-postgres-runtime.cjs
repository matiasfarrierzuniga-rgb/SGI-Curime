// Fail closed before starting the production backend. Never log connection details.
const { Client } = require('pg');
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('missing runtime database URL');
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await db.connect();
    const result = await db.query(`
      SELECT current_user = 'sgi_backend'
        AND NOT (SELECT rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls FROM pg_roles WHERE rolname=current_user)
        AND NOT pg_has_role(current_user, 'sgi_migrator', 'MEMBER')
        AND NOT has_schema_privilege(current_user, 'public', 'CREATE')
        AND NOT has_database_privilege(current_user, current_database(), 'TEMPORARY')
        AND to_regclass('public."_prisma_migrations"') IS NOT NULL
        AND NOT has_table_privilege(current_user, 'public."_prisma_migrations"', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
        AND to_regclass('public."User"') IS NOT NULL
        AND NOT EXISTS (
          SELECT FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname='public' AND c.relkind IN ('r','p')
            AND c.relname <> '_prisma_migrations'
            AND (pg_get_userbyid(c.relowner) = current_user
              OR NOT has_table_privilege(current_user,c.oid,'SELECT')
              OR NOT has_table_privilege(current_user,c.oid,'INSERT')
              OR NOT has_table_privilege(current_user,c.oid,'UPDATE')
              OR NOT has_table_privilege(current_user,c.oid,'DELETE'))
        )
        AND NOT EXISTS (
          SELECT FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname='public' AND c.relkind='S'
            AND (pg_get_userbyid(c.relowner) = current_user
              OR NOT has_sequence_privilege(current_user,c.oid,'USAGE'))
        ) AS ok`);
    if (result.rows[0]?.ok !== true) throw new Error('runtime permissions rejected');
  } finally { await db.end(); }
}
main().catch(() => { console.error('PostgreSQL runtime permission check failed'); process.exitCode = 1; });
