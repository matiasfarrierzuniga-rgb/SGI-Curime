import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const INITIAL_ROLES = [
  {
    name: 'Administrador',
    description:
      'Gestiona la configuración y administración general del sistema.',
  },
  {
    name: 'Tesorero',
    description: 'Gestiona las funciones financieras autorizadas.',
  },
  {
    name: 'Gestor de Inventario',
    description: 'Gestiona el inventario institucional autorizado.',
  },
  {
    name: 'Vecino/Afiliado',
    description: 'Accede a las funciones disponibles para vecinos y afiliados.',
  },
  {
    name: 'Subscription_L1',
    description: 'Acceso de suscripción de nivel 1.',
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
  const adminIdentification = requiredEnvironmentVariable(
    'ADMIN_IDENTIFICATION',
  );
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
          update: {},
          create: role,
        }),
      ),
    );

    const administratorRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'Administrador' },
    });

    const [userWithEmail, userWithIdentification] = await Promise.all([
      prisma.user.findUnique({ where: { email: adminEmail } }),
      prisma.user.findUnique({
        where: { identification: adminIdentification },
      }),
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
