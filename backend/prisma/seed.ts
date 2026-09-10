import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  ReservableResourceStatus,
  ResourcePricingType,
} from '../generated/prisma/client';
import { ensureInitialRoles } from './seed-roles';

const INITIAL_RESERVABLE_RESOURCES = [
  {
    name: 'Salón Comunal',
    description:
      'Espacio para reuniones, talleres, asambleas y actividades comunitarias.',
    location: 'Centro de Curime',
    capacity: 120,
    status: ReservableResourceStatus.ACTIVE,
    pricingType: ResourcePricingType.FIXED,
    price: '25000.00',
  },
  {
    name: 'Plaza de Deportes',
    description:
      'Espacio abierto para actividades deportivas y eventos comunitarios.',
    location: 'Curime',
    capacity: 300,
    status: ReservableResourceStatus.ACTIVE,
    pricingType: ResourcePricingType.FIXED,
    price: '15000.00',
  },
  {
    name: 'Cancha Multiuso',
    description:
      'Cancha para fútbol sala, baloncesto y actividades recreativas.',
    location: 'Área comunal de Curime',
    capacity: 80,
    status: ReservableResourceStatus.ACTIVE,
    pricingType: ResourcePricingType.FIXED,
    price: '10000.00',
  },
  {
    name: 'Sala de Reuniones',
    description:
      'Espacio para reuniones de junta, comités y capacitaciones pequeñas.',
    location: 'Salón Comunal de Curime',
    capacity: 20,
    status: ReservableResourceStatus.ACTIVE,
    pricingType: ResourcePricingType.FIXED,
    price: '5000.00',
  },
  {
    name: 'Kiosco Comunal',
    description:
      'Recurso temporalmente fuera de servicio para validar filtrado de recursos inactivos.',
    location: 'Curime',
    capacity: 30,
    status: ReservableResourceStatus.INACTIVE,
    pricingType: ResourcePricingType.FIXED,
    price: '5000.00',
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
    await ensureInitialRoles(prisma);

    for (const resource of INITIAL_RESERVABLE_RESOURCES) {
      const existing = await prisma.reservableResource.findFirst({
        where: { name: resource.name },
        select: { id: true },
      });

      if (existing) {
        await prisma.reservableResource.update({
          where: { id: existing.id },
          data: resource,
        });
      } else {
        await prisma.reservableResource.create({ data: resource });
      }
    }

    console.log('Initial reservable resources were ensured successfully.');

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
