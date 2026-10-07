import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { processEnvironmentForTest } from './disposable-postgres-guard.mjs';

Object.assign(process.env, processEnvironmentForTest(process.env));

const marker = `disposable-smoke-${process.pid}-${Date.now()}`;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    await prisma.$connect();
    const created = await prisma.inventoryCategory.create({ data: { name: marker } });
    const read = await prisma.inventoryCategory.findUnique({ where: { id: created.id } });
    if (!read || read.name !== marker) throw new Error('Prisma smoke read mismatch');
    await prisma.inventoryCategory.delete({ where: { id: created.id } });
    const deleted = await prisma.inventoryCategory.findUnique({ where: { id: created.id } });
    if (deleted !== null) throw new Error('Prisma smoke delete mismatch');
    console.log('disposable-postgres smoke: Prisma insert/read/delete passed');
  } finally {
    await prisma.$disconnect();
  }
}

void main();
