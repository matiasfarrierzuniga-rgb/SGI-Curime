import * as bcrypt from 'bcrypt';
import { CANONICAL_ROLE_CODES } from '../src/auth/domain/policies/canonical-role-catalog';
import { CANONICAL_ROLE_GRANTS } from '../src/auth/domain/policies/canonical-role-grants';
import {
  runMinimalBootstrap,
  validateMinimalBootstrapAdmin,
  type MinimalBootstrapClient,
} from './minimal-bootstrap';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('secure-hash'),
  compare: jest.fn().mockResolvedValue(true),
}));

const admin = {
  fullName: 'Administración Inicial',
  identification: '123456789',
  email: 'ADMIN@ADICURIME.COM ',
  password: 'StrongPassword1',
};

function fixture(
  overrides: {
    candidates?: unknown[];
    administratorCount?: number;
    communityPermissions?: string[];
  } = {},
) {
  const roles = CANONICAL_ROLE_CODES.map((name, index) => ({
    id: index + 1,
    name,
    isActive: true,
    permissions: (name === 'ROLE_COMMUNITY_USER'
      ? (overrides.communityPermissions ?? [])
      : []
    ).map((code) => ({ permission: { code } })),
  }));
  const tx = {
    role: {
      upsert: jest.fn().mockResolvedValue(undefined),
      findMany: jest.fn().mockResolvedValue(roles),
      findUniqueOrThrow: jest.fn(({ where }: { where: { name: string } }) =>
        Promise.resolve({
          id: roles.find((role) => role.name === where.name)!.id,
        }),
      ),
    },
    permission: {
      upsert: jest.fn().mockResolvedValue(undefined),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 100 }),
    },
    rolePermission: {
      upsert: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(115),
    },
    user: {
      findMany: jest.fn().mockResolvedValue(overrides.candidates ?? []),
      count: jest.fn().mockResolvedValue(overrides.administratorCount ?? 0),
      create: jest.fn().mockResolvedValue({ id: 77 }),
    },
    auditLog: { create: jest.fn().mockResolvedValue(undefined) },
  };
  const transaction = jest.fn(
    (operation: (transaction: typeof tx) => Promise<unknown>) => operation(tx),
  );
  const client = {
    $transaction: transaction,
  } as unknown as MinimalBootstrapClient;
  return { client, transaction, tx };
}

describe('minimal production bootstrap', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates only canonical RBAC, one administrator and one safe audit event', async () => {
    const { client, transaction, tx } = fixture();
    const result = await runMinimalBootstrap(client, admin);

    expect(result).toEqual({ administrator: 'CREATED', roles: 6, grants: 115 });
    expect(tx.role.upsert).toHaveBeenCalledTimes(6);
    expect(tx.rolePermission.upsert).toHaveBeenCalledTimes(115);
    const createCall = tx.user.create.mock.calls[0] as unknown as [
      { data: Record<string, unknown>; select: { id: boolean } },
    ];
    expect(createCall[0]).toMatchObject({
      data: {
        email: 'admin@adicurime.com',
        identification: '123456789',
        passwordHash: 'secure-hash',
        status: 'ACTIVE',
        personId: null,
      },
      select: { id: true },
    });
    const auditCall = tx.auditLog.create.mock.calls[0] as unknown as [
      { data: Record<string, unknown> },
    ];
    expect(auditCall[0]).toMatchObject({
      data: {
        userId: 77,
        action: 'USER_CREATED',
        details: {
          source: 'MINIMAL_BOOTSTRAP',
          role: 'ROLE_SYSTEM_ADMIN',
        },
      },
    });
    expect(JSON.stringify(tx.auditLog.create.mock.calls)).not.toContain(
      admin.password,
    );
    expect(transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: 'Serializable' }),
    );
  });

  it('keeps an exact existing administrator unchanged', async () => {
    const { client, tx } = fixture({
      administratorCount: 1,
      candidates: [
        {
          id: 77,
          email: 'admin@adicurime.com',
          identification: '123456789',
          passwordHash: 'existing-hash',
          status: 'ACTIVE',
          role: { name: 'ROLE_SYSTEM_ADMIN', isActive: true },
        },
      ],
    });

    await expect(runMinimalBootstrap(client, admin)).resolves.toEqual({
      administrator: 'UNCHANGED',
      roles: 6,
      grants: 115,
    });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'StrongPassword1',
      'existing-hash',
    );
    expect(tx.user.create).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it('does not reset an existing administrator password', async () => {
    jest.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);
    const { client, tx } = fixture({
      administratorCount: 1,
      candidates: [
        {
          id: 77,
          email: 'admin@adicurime.com',
          identification: '123456789',
          passwordHash: 'existing-hash',
          status: 'ACTIVE',
          role: { name: 'ROLE_SYSTEM_ADMIN', isActive: true },
        },
      ],
    });

    await expect(runMinimalBootstrap(client, admin)).rejects.toThrow(
      'BOOTSTRAP_ADMIN_IDENTITY_CONFLICT',
    );
    expect(tx.user.create).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it('rejects partial identity matches without changing the account', async () => {
    const { client, tx } = fixture({
      administratorCount: 1,
      candidates: [
        {
          id: 77,
          email: 'different@adicurime.com',
          identification: '123456789',
          passwordHash: 'existing-hash',
          status: 'ACTIVE',
          role: { name: 'ROLE_SYSTEM_ADMIN', isActive: true },
        },
      ],
    });
    await expect(runMinimalBootstrap(client, admin)).rejects.toThrow(
      'BOOTSTRAP_ADMIN_IDENTITY_CONFLICT',
    );
    expect(tx.user.create).not.toHaveBeenCalled();
  });

  it('rejects unexpected canonical grants instead of revoking them', async () => {
    const { client, tx } = fixture({
      communityPermissions: ['erp.dashboard.read'],
    });
    await expect(runMinimalBootstrap(client, admin)).rejects.toThrow(
      'BOOTSTRAP_REJECTED_UNEXPECTED_GRANTS',
    );
    expect(tx.rolePermission.upsert).not.toHaveBeenCalled();
    expect(tx.user.create).not.toHaveBeenCalled();
  });

  it('uses the current password policy and normalizes non-secret identity fields', () => {
    expect(validateMinimalBootstrapAdmin(admin)).toEqual({
      ...admin,
      fullName: 'Administración Inicial',
      email: 'admin@adicurime.com',
    });
    expect(() =>
      validateMinimalBootstrapAdmin({ ...admin, password: 'weak' }),
    ).toThrow('INVALID_ADMIN_PASSWORD');
  });

  it('derives every grant from the canonical contract', () => {
    expect(
      Object.values(CANONICAL_ROLE_GRANTS).reduce(
        (total, grants) => total + grants.length,
        0,
      ),
    ).toBe(115);
  });
});
