import { createRequire } from 'node:module';
import { processEnvironmentForTest } from './disposable-postgres-guard.mjs';

Object.assign(process.env, processEnvironmentForTest(process.env));

const require = createRequire(import.meta.url);
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../../generated/prisma/client');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

try {
  await prisma.$connect();
  await prisma.inventoryCategory.deleteMany({
    where: { name: { startsWith: 'disposable-smoke-' } },
  });
  console.log('disposable-postgres cleanup: scoped smoke fixtures removed');
} finally {
  await prisma.$disconnect();
}
