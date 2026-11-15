import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { getPostgresConnectionConfig } from '../src/prisma/postgres-connection';
import { readBootstrapAdminFile } from './bootstrap-admin-input';
import { validateMinimalBootstrapTarget } from './bootstrap-target';
import {
  runMinimalBootstrap,
  type MinimalBootstrapClient,
} from './minimal-bootstrap';

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error('DATABASE_URL_REQUIRED');
  validateMinimalBootstrapTarget(connectionString);
  const admin = await readBootstrapAdminFile(process.env.BOOTSTRAP_ADMIN_FILE);
  const prisma = new PrismaClient({
    adapter: new PrismaPg(getPostgresConnectionConfig(connectionString)),
  });
  try {
    const result = await runMinimalBootstrap(
      prisma as unknown as MinimalBootstrapClient,
      admin,
    );
    console.log(
      `Minimal bootstrap completed: administrator=${result.administrator} roles=${result.roles} grants=${result.grants}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error('Minimal bootstrap failed.');
  process.exitCode = 1;
});
