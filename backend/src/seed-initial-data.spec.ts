import {
  assertInitialAdministratorRole,
  ensureInitialReservableResources,
  resolveInitialAdministrator,
} from '../prisma/seed-initial-data';
import { PrismaClient } from '../generated/prisma/client';

describe('initial seed data', () => {
  describe('ensureInitialReservableResources', () => {
    it('creates missing resources without updating existing resources', async () => {
      const existingResource = { id: 1 };
      const findFirst = jest
        .fn()
        .mockResolvedValueOnce(existingResource)
        .mockResolvedValue(null);
      const create = jest
        .fn((args: { data: { name: string } }) =>
          Promise.resolve({ id: args.data.name.length }),
        )
        .mockResolvedValue({ id: 2 });
      const prisma = {
        reservableResource: { findFirst, create },
      } as unknown as Pick<PrismaClient, 'reservableResource'>;

      await ensureInitialReservableResources(prisma);

      expect(findFirst).toHaveBeenCalledTimes(5);
      expect(create).toHaveBeenCalledTimes(4);
      expect(create.mock.calls.map(([args]) => args.data.name)).not.toContain(
        'Salón Comunal',
      );
    });
  });

  describe('resolveInitialAdministrator', () => {
    it('returns the account only when email and identification match it', () => {
      const existingUser = { id: 7, roleId: 1 };

      expect(resolveInitialAdministrator(existingUser, existingUser)).toBe(
        existingUser,
      );
      expect(resolveInitialAdministrator(null, null)).toBeNull();
    });

    it.each([
      [{ id: 7, roleId: 1 }, null],
      [null, { id: 7, roleId: 1 }],
      [
        { id: 7, roleId: 1 },
        { id: 8, roleId: 1 },
      ],
    ])(
      'rejects conflicting account identities',
      (byEmail, byIdentification) => {
        expect(() =>
          resolveInitialAdministrator(byEmail, byIdentification),
        ).toThrow(/identity conflicts with an existing account/i);
      },
    );
  });

  describe('assertInitialAdministratorRole', () => {
    it('rejects credentials that resolve to an account without the admin role', () => {
      expect(() =>
        assertInitialAdministratorRole({ id: 7, roleId: 2 }, 1),
      ).toThrow(/without the Administrador role/i);
    });

    it('accepts the matching administrator account', () => {
      expect(() =>
        assertInitialAdministratorRole({ id: 7, roleId: 1 }, 1),
      ).not.toThrow();
    });
  });
});
