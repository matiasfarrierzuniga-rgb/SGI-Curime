import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { ensureInitialRoles } from './seed-roles';
import {
  assertInitialAdministratorRole,
  ensureInitialReservableResources,
  resolveInitialAdministrator,
} from './seed-initial-data';

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main(): Promise<void> {
  const connectionString = requiredEnvironmentVariable('DATABASE_URL');
  const adminName = requiredEnvironmentVariable('ADMIN_NAME');
  const adminIdentification = requiredEnvironmentVariable(
    'ADMIN_IDENTIFICATION',
  );
  const adminEmail = requiredEnvironmentVariable('ADMIN_EMAIL');
  const adminPassword = requiredEnvironmentVariable('ADMIN_PASSWORD');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const [userWithEmail, userWithIdentification] = await Promise.all([
      prisma.user.findUnique({
        where: { email: adminEmail },
        select: { id: true, roleId: true },
      }),
      prisma.user.findUnique({
        where: { identification: adminIdentification },
        select: { id: true, roleId: true },
      }),
    ]);
    const existingAdministrator = resolveInitialAdministrator(
      userWithEmail,
      userWithIdentification,
    );

    await ensureInitialRoles(prisma);
    const administratorRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'Administrador' },
    });
    assertInitialAdministratorRole(existingAdministrator, administratorRole.id);

    await ensureInitialReservableResources(prisma);
    console.log('Initial reservable resources were ensured successfully.');

    if (existingAdministrator) {
      console.log('Initial administrator already exists; no user was created.');
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await prisma.user.create({
      data: {
        fullName: adminName,
        identification: adminIdentification,
        email: adminEmail,
        passwordHash,
        roleId: administratorRole.id,
      },
    });

    console.log('Initial roles and administrator were created successfully.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Database seed failed.', error);
  process.exitCode = 1;
});
