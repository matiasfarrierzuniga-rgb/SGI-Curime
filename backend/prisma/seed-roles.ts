export const INITIAL_ROLES = [
  { name: 'Administrador', description: 'Gestiona la configuración y administración general del sistema.' },
  { name: 'Tesorero', description: 'Gestiona las funciones financieras autorizadas.' },
  { name: 'Gestor de Inventario', description: 'Gestiona el inventario institucional autorizado.' },
  { name: 'Vecino/Afiliado', description: 'Accede a las funciones disponibles para vecinos y afiliados.' },
  { name: 'Miembro de Junta Directiva', description: 'Representa a una persona integrante de la Junta Directiva.' },
  { name: 'Subscription_L1', description: 'Acceso de suscripción de nivel 1.' },
] as const;

type RoleSeeder = {
  role: { upsert(args: { where: { name: string }; update: object; create: { name: string; description: string } }): unknown };
  $transaction(operations: unknown[]): Promise<unknown>;
};

export function ensureInitialRoles(prisma: RoleSeeder) {
  return prisma.$transaction(INITIAL_ROLES.map((role) => prisma.role.upsert({ where: { name: role.name }, update: {}, create: role })));
}
