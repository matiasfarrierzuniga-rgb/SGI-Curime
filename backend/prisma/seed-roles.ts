import {
  CAPABILITIES,
  ROLE_CAPABILITIES,
} from '../src/auth/presentation/capabilities/capability-policy';

export const INITIAL_ROLES = [
  { name: 'Administrador', description: 'Gestiona la configuración y administración general del sistema.' },
  { name: 'Tesorero', description: 'Gestiona las funciones financieras autorizadas.' },
  { name: 'Gestor de Inventario', description: 'Gestiona el inventario institucional autorizado.' },
  { name: 'Vecino/Afiliado', description: 'Accede a las funciones disponibles para vecinos y afiliados.' },
  { name: 'Miembro de Junta Directiva', description: 'Representa a una persona integrante de la Junta Directiva.' },
  { name: 'Subscription_L1', description: 'Acceso de suscripción de nivel 1.' },
] as const;

export const INITIAL_PERMISSIONS = CAPABILITIES.map((code) => ({
  code,
  name: code,
}));

type RoleSeeder = {
  role: {
    upsert(args: {
      where: { name: string };
      update: object;
      create: { name: string; description: string };
    }): unknown;
    findUniqueOrThrow(args: {
      where: { name: string };
      select: { id: true };
    }): Promise<{ id: number }>;
  };
  permission: {
    upsert(args: {
      where: { code: string };
      update: object;
      create: { code: string; name: string };
    }): Promise<{ id: number; code: string }>;
  };
  rolePermission: {
    upsert(args: {
      where: { roleId_permissionId: { roleId: number; permissionId: number } };
      update: object;
      create: { roleId: number; permissionId: number };
    }): unknown;
  };
  $transaction(
    operations: unknown[],
    options?: { timeout?: number },
  ): Promise<unknown>;
};

export async function ensureInitialRoles(prisma: RoleSeeder): Promise<void> {
  await prisma.$transaction(
    INITIAL_ROLES.map((role) =>
      prisma.role.upsert({ where: { name: role.name }, update: {}, create: role }),
    ),
  );

  const permissions = await Promise.all(
    INITIAL_PERMISSIONS.map((permission) =>
      prisma.permission.upsert({
        where: { code: permission.code },
        update: {},
        create: permission,
      }),
    ),
  );
  const roles = await Promise.all(
    Object.keys(ROLE_CAPABILITIES).map(async (name) => ({
      name,
      id: (
        await prisma.role.findUniqueOrThrow({
          where: { name },
          select: { id: true },
        })
      ).id,
    })),
  );
  const roleIds = new Map(roles.map((role) => [role.name, role.id]));
  const permissionIds = new Map(
    permissions.map((permission) => [permission.code, permission.id]),
  );

  await prisma.$transaction(
    Object.entries(ROLE_CAPABILITIES).flatMap(([roleName, capabilities]) =>
      capabilities.map((capability) =>
        prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: roleIds.get(roleName)!,
              permissionId: permissionIds.get(capability)!,
            },
          },
          update: {},
          create: {
            roleId: roleIds.get(roleName)!,
            permissionId: permissionIds.get(capability)!,
          },
        }),
      ),
    ),
    { timeout: 30_000 },
  );
}
