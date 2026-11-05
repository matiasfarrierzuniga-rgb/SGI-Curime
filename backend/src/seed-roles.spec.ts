import { ensureInitialRoles, INITIAL_ROLES } from '../prisma/seed-roles';
import { CANONICAL_ROLE_CODES } from './auth/domain/policies/canonical-role-catalog';

describe('initial role seed', () => {
  it('contains only the six canonical roles', () => {
    expect(INITIAL_ROLES.map((role) => role.name)).toEqual(
      CANONICAL_ROLE_CODES,
    );
    expect(INITIAL_ROLES).toHaveLength(6);
  });

  it('ensures canonical roles idempotently without writing permissions or grants', async () => {
    const roleUpsert = jest.fn();
    const transaction = jest.fn().mockResolvedValue(undefined);
    const prisma = {
      role: { upsert: roleUpsert },
      $transaction: transaction,
    };

    await ensureInitialRoles(prisma);
    await ensureInitialRoles(prisma);

    expect(transaction).toHaveBeenCalledTimes(2);
    expect(roleUpsert).toHaveBeenCalledTimes(CANONICAL_ROLE_CODES.length * 2);
    for (const role of INITIAL_ROLES) {
      expect(roleUpsert).toHaveBeenCalledWith({
        where: { name: role.name },
        update: {},
        create: role,
      });
    }
    expect(prisma).not.toHaveProperty('permission');
    expect(prisma).not.toHaveProperty('rolePermission');
  });
});
