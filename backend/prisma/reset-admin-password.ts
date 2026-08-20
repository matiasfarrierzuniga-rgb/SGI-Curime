import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const ADMIN_ROLE = 'Administrador';
const BCRYPT_ROUNDS = 12;

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main(): Promise<void> {
  const connectionString = requiredEnvironmentVariable('DATABASE_URL');
  const adminEmail = requiredEnvironmentVariable('ADMIN_EMAIL');
  const adminPassword = requiredEnvironmentVariable('ADMIN_PASSWORD');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const administrator = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: {
        id: true,
        role: { select: { name: true } },
      },
    });

    if (!administrator) {
      throw new Error('Initial administrator was not found.');
    }

    if (administrator.role.name !== ADMIN_ROLE) {
      throw new Error('The configured user is not an administrator.');
    }

    const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);

    const updatedAdministrator = await prisma.user.update({
      where: { id: administrator.id },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedAt: null,
        status: 'ACTIVE',
      },
      select: {
        status: true,
        failedLoginAttempts: true,
        lockedAt: true,
        role: { select: { name: true } },
      },
    });

    if (
      updatedAdministrator.status !== 'ACTIVE' ||
      updatedAdministrator.role.name !== ADMIN_ROLE ||
      updatedAdministrator.failedLoginAttempts !== 0 ||
      updatedAdministrator.lockedAt !== null
    ) {
      throw new Error('Initial administrator verification failed.');
    }

    console.log('Initial administrator password was reset successfully.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error('Initial administrator password reset failed.');
  process.exitCode = 1;
});
