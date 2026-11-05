import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const outputPath = process.argv[2] ? resolve(process.argv[2]) : undefined;
const roleCodes = [
  'ROLE_SYSTEM_ADMIN',
  'ROLE_INSTITUTIONAL_PRESIDENT',
  'ROLE_INSTITUTIONAL_SECRETARY',
  'ROLE_INSTITUTIONAL_TREASURER',
  'ROLE_INSTITUTIONAL_OPERATOR',
  'ROLE_COMMUNITY_USER',
];

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

try {
  await client.query('BEGIN TRANSACTION READ ONLY');
  const result = await client.query(
    `SELECT
       r.name AS role_code,
       r."isActive" AS role_active,
       p.code AS capability_code,
       p.description AS capability_description
     FROM "Role" AS r
     LEFT JOIN "RolePermission" AS rp ON rp."roleId" = r.id
     LEFT JOIN "Permission" AS p ON p.id = rp."permissionId"
     WHERE r.name = ANY($1::text[])
     ORDER BY r.name, p.code NULLS FIRST`,
    [roleCodes],
  );
  await client.query('COMMIT');

  const matrix = result.rows;
  if (outputPath) {
    await writeFile(outputPath, `${JSON.stringify(matrix, null, 2)}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(matrix, null, 2)}\n`);
  }
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
