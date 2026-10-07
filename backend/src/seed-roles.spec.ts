import {
  ensureInitialRoles,
  INITIAL_PERMISSIONS,
  INITIAL_ROLES,
} from '../prisma/seed-roles';
import { ROLE_CAPABILITIES } from './auth/presentation/capabilities/capability-policy';

describe('initial role seed', () => {
  it('ensures Miembro de Junta Directiva idempotently without removing base roles', async () => {
    const upsert = jest.fn();
    const roleIds = new Map(
      INITIAL_ROLES.map((role, index) => [role.name, index + 1]),
    );
    const permissionIds = new Map(
      INITIAL_PERMISSIONS.map((permission, index) => [
        permission.code,
        index + 101,
      ]),
    );
    const permissionUpsert = jest.fn(
      ({ create }: { create: { code: string } }) =>
        Promise.resolve({
          id: permissionIds.get(create.code)!,
          code: create.code,
        }),
    );
    const rolePermissionUpsert = jest.fn();
    const transaction = jest
      .fn<(operations: unknown[]) => Promise<void>>()
      .mockResolvedValue(undefined);
    const prisma = {
      role: {
        upsert,
        findUniqueOrThrow: jest.fn(({ where }: { where: { name: string } }) =>
          Promise.resolve({ id: roleIds.get(where.name)! }),
        ),
      },
      permission: { upsert: permissionUpsert },
      rolePermission: { upsert: rolePermissionUpsert },
      $transaction: transaction,
    };

    await ensureInitialRoles(prisma);
    await ensureInitialRoles(prisma);

    expect(INITIAL_ROLES.map((role) => role.name)).toEqual(
      expect.arrayContaining([
        'Administrador',
        'Tesorero',
        'Gestor de Inventario',
        'Vecino/Afiliado',
        'Miembro de Junta Directiva',
        'Subscription_L1',
      ]),
    );
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: 'Miembro de Junta Directiva' },
        update: {},
      }),
    );
    expect(transaction).toHaveBeenCalledTimes(4);
  });

  it('persists every compatibility capability and mapped role grant idempotently', async () => {
    expect(INITIAL_PERMISSIONS).toHaveLength(45);
    expect(ROLE_CAPABILITIES.Administrador).toHaveLength(43);
    expect(INITIAL_PERMISSIONS).toEqual(
      expect.arrayContaining([
        { code: 'adm.justifications.read', name: 'adm.justifications.read' },
        {
          code: 'adm.justifications.approve',
          name: 'adm.justifications.approve',
        },
        {
          code: 'adm.justifications.reject',
          name: 'adm.justifications.reject',
        },
        { code: 'usr.users.update', name: 'usr.users.update' },
        { code: 'usr.user-requests.read', name: 'usr.user-requests.read' },
        { code: 'usr.user-requests.review', name: 'usr.user-requests.review' },
        { code: 'ent.ventures.read', name: 'ent.ventures.read' },
        { code: 'ent.ventures.create', name: 'ent.ventures.create' },
        { code: 'ent.ventures.update', name: 'ent.ventures.update' },
        { code: 'vol.opportunities.read', name: 'vol.opportunities.read' },
        { code: 'vol.opportunities.create', name: 'vol.opportunities.create' },
        { code: 'vol.opportunities.update', name: 'vol.opportunities.update' },
        {
          code: 'usr.users.role.change',
          name: 'usr.users.role.change',
        },
        {
          code: 'usr.users.lifecycle.manage',
          name: 'usr.users.lifecycle.manage',
        },
        { code: 'usr.users.unlock', name: 'usr.users.unlock' },
      ]),
    );
    expect(ROLE_CAPABILITIES['Gestor de Inventario']).toHaveLength(3);
    expect(ROLE_CAPABILITIES.Tesorero).toHaveLength(9);

    const roleIds = new Map(
      Object.keys(ROLE_CAPABILITIES).map((name, index) => [name, index + 1]),
    );
    const permissionIds = new Map(
      INITIAL_PERMISSIONS.map((permission, index) => [
        permission.code,
        index + 101,
      ]),
    );
    const roleNameById = new Map(
      Array.from(roleIds, ([name, id]) => [id, name]),
    );
    const capabilityById = new Map(
      Array.from(permissionIds, ([code, id]) => [id, code]),
    );
    const permissionUpsert = jest.fn(
      ({ create }: { create: { code: string } }) =>
        Promise.resolve({
          id: permissionIds.get(create.code)!,
          code: create.code,
        }),
    );
    const rolePermissionUpsert = jest.fn();
    const prisma = {
      role: {
        upsert: jest.fn(),
        findUniqueOrThrow: jest.fn(({ where }: { where: { name: string } }) =>
          Promise.resolve({ id: roleIds.get(where.name)! }),
        ),
      },
      permission: { upsert: permissionUpsert },
      rolePermission: { upsert: rolePermissionUpsert },
      $transaction: jest.fn().mockResolvedValue(undefined),
    };

    await ensureInitialRoles(prisma);
    await ensureInitialRoles(prisma);

    expect(permissionUpsert).toHaveBeenCalledTimes(INITIAL_PERMISSIONS.length * 2);
    expect(permissionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { code: 'don.donations.read' },
        create: { code: 'don.donations.read', name: 'don.donations.read' },
        update: {},
      }),
    );
    const grantCount = Object.values(ROLE_CAPABILITIES).reduce(
      (total, capabilities) => total + capabilities.length,
      0,
    );
    expect(rolePermissionUpsert).toHaveBeenCalledTimes(grantCount * 2);
    const expectedPairs = Object.entries(ROLE_CAPABILITIES).flatMap(
      ([roleName, capabilities]) =>
        capabilities.map((capability) => `${roleName}:${capability}`),
    );
    const observedPairs = rolePermissionUpsert.mock.calls.map(
      ([{ create, update, where }]) => {
        expect(where).toEqual({ roleId_permissionId: create });
        expect(update).toEqual({});
        return `${roleNameById.get(create.roleId)}:${capabilityById.get(
          create.permissionId,
        )}`;
      },
    );

    expect(observedPairs).toEqual([...expectedPairs, ...expectedPairs]);
    expect(new Set(observedPairs)).toEqual(new Set(expectedPairs));
  });
});
