import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { ROLE_NAMES } from '../src/common/security/roles';

const INITIAL_ROLES = [
  {
    name: ROLE_NAMES.ADMIN,
    description: 'Gestiona la configuración y administración general del sistema.',
  },
  {
    name: ROLE_NAMES.TREASURER,
    description: 'Gestiona las funciones financieras autorizadas.',
  },
  {
    name: ROLE_NAMES.INVENTORY_MANAGER,
    description: 'Gestiona el inventario institucional autorizado.',
  },
  {
    name: ROLE_NAMES.USER,
    description: 'Cuenta autenticada sin permisos administrativos.',
  },
] as const;

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
  const adminIdentification = requiredEnvironmentVariable('ADMIN_IDENTIFICATION');
  const adminEmail = requiredEnvironmentVariable('ADMIN_EMAIL');
  const adminPassword = requiredEnvironmentVariable('ADMIN_PASSWORD');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    await prisma.$transaction(
      INITIAL_ROLES.map((role) =>
        prisma.role.upsert({
          where: { name: role.name },
          update: {
            description: role.description,
            isActive: true,
          },
          create: role,
        }),
      ),
    );

    const administratorRole = await prisma.role.findUniqueOrThrow({
      where: { name: ROLE_NAMES.ADMIN },
    });

    const [userWithEmail, userWithIdentification] = await Promise.all([
      prisma.user.findUnique({ where: { email: adminEmail } }),
      prisma.user.findUnique({ where: { identification: adminIdentification } }),
    ]);

    if (userWithEmail || userWithIdentification) {
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
