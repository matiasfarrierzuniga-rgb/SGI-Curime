import {
  PrismaClient,
  ReservableResourceStatus,
  ResourcePricingType,
} from '../generated/prisma/client';

export const INITIAL_RESERVABLE_RESOURCES = [
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

type InitialResource = (typeof INITIAL_RESERVABLE_RESOURCES)[number];

type InitialResourceSeeder = Pick<PrismaClient, 'reservableResource'>;

export async function ensureInitialReservableResources(
  prisma: InitialResourceSeeder,
): Promise<void> {
  for (const resource of INITIAL_RESERVABLE_RESOURCES) {
    const existing = await prisma.reservableResource.findFirst({
      where: { name: resource.name },
      select: { id: true },
    });

    if (!existing) {
      await prisma.reservableResource.create({
        data: resource satisfies InitialResource,
      });
    }
  }
}

export type SeedAdministratorIdentity = {
  id: number;
  roleId: number;
};

export function resolveInitialAdministrator(
  userWithEmail: SeedAdministratorIdentity | null,
  userWithIdentification: SeedAdministratorIdentity | null,
): SeedAdministratorIdentity | null {
  if (!userWithEmail && !userWithIdentification) {
    return null;
  }

  if (
    !userWithEmail ||
    !userWithIdentification ||
    userWithEmail.id !== userWithIdentification.id
  ) {
    throw new Error(
      'Initial administrator identity conflicts with an existing account. Verify ADMIN_EMAIL and ADMIN_IDENTIFICATION.',
    );
  }

  return userWithEmail;
}

export function assertInitialAdministratorRole(
  administrator: SeedAdministratorIdentity | null,
  administratorRoleId: number,
): void {
  if (administrator && administrator.roleId !== administratorRoleId) {
    throw new Error(
      'Initial administrator credentials belong to an account without the Administrador role. No account was changed.',
    );
  }
}
