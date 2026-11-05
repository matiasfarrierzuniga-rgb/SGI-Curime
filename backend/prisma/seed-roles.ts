import { CANONICAL_ROLES } from '../src/auth/domain/policies/canonical-role-catalog';

export const INITIAL_ROLES = CANONICAL_ROLES.map((role) => ({
  name: role.code,
  description: role.description,
}));

type RoleSeeder = {
  role: {
    upsert(args: {
      where: { name: string };
      update: object;
      create: { name: string; description: string };
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
      prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      }),
    ),
  );

}
