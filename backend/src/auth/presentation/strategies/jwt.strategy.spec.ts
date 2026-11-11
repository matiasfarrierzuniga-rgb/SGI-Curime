import { UnauthorizedException } from '@nestjs/common';
import type { AuthRepository } from '../../application/ports/auth-repository.port';
import { JwtStrategy } from './jwt.strategy';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.ACCOUNT_LOCKOUT_MINUTES = '30';
process.env.MAX_LOGIN_ATTEMPTS = '5';

const account = {
  id: 1,
  email: 'admin@example.com',
  fullName: 'Admin',
  status: 'ACTIVE',
  passwordHash: 'hashed',
  lockedAt: null,
  failedLoginAttempts: 0,
  lastLoginAt: null,
  roleName: 'ROLE_SYSTEM_ADMIN',
  roleId: 2,
  roleIsActive: true,
  permissionCodes: ['usr.users.read'],
  hasPerson: true,
  affiliateStatus: 'ACTIVE',
  affiliateRoleId: 2,
  subscriptionExpirationDate: null,
  sessionGeneration: 0,
};

describe('JwtStrategy persisted RBAC mapping', () => {
  const findCredentialsById = jest.fn();
  const repository = {
    findCredentialsById,
    clearLockout: jest.fn(),
  } as unknown as AuthRepository;
  const sessions = { findActiveById: jest.fn() };
  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(repository, sessions as never);
    findCredentialsById.mockResolvedValue(account);
    sessions.findActiveById.mockResolvedValue({ id: 7, userId: 1 });
  });

  it('returns current canonical role and persisted permission codes', async () => {
    await expect(
      strategy.validate({
        sub: 1,
        email: account.email,
        role: account.roleName,
        sessionGeneration: 0,
        sid: 7,
      }),
    ).resolves.toEqual({
      id: 1,
      fullName: 'Admin',
      email: 'admin@example.com',
      status: 'ACTIVE',
      role: 'ROLE_SYSTEM_ADMIN',
      permissionCodes: ['usr.users.read'],
      canAccessErp: true,
      sessionId: 7,
    });
    expect(findCredentialsById).toHaveBeenCalledWith(1);
  });

  it('ignores a historical or manipulated role claim in favor of persisted access', async () => {
    await expect(
      strategy.validate({
        sub: 1,
        email: account.email,
        role: 'ROLE_COMMUNITY_USER',
        sessionGeneration: 0,
        sid: 7,
      }),
    ).resolves.toMatchObject({
      role: 'ROLE_SYSTEM_ADMIN',
      permissionCodes: ['usr.users.read'],
      canAccessErp: true,
    });
  });

  it.each([0, -1, 1.5, Number.NaN])(
    'rejects invalid JWT subject %s before querying persisted access',
    async (sub) => {
      await expect(
        strategy.validate({
          sub,
          email: account.email,
          role: account.roleName,
          sessionGeneration: 0,
          sid: 7,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(findCredentialsById).not.toHaveBeenCalled();
    },
  );

  it('revokes prior generations across same-second deactivation and reactivation', async () => {
    findCredentialsById.mockResolvedValue({
      ...account,
      status: 'ACTIVE',
      sessionGeneration: 1,
    });
    await expect(
      strategy.validate({
        sub: 1,
        email: account.email,
        role: account.roleName,
        iat: 2000,
        sessionGeneration: 0,
        sid: 7,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      strategy.validate({
        sub: 1,
        email: account.email,
        role: account.roleName,
        iat: 2000,
        sessionGeneration: 1,
        sid: 7,
      }),
    ).resolves.toBeDefined();
  });

  it('rejects JWTs without sid', async () => {
    await expect(
      strategy.validate({
        sub: 1,
        email: account.email,
        role: account.roleName,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    findCredentialsById.mockResolvedValue({
      ...account,
      sessionGeneration: 1,
    });
    await expect(
      strategy.validate({
        sub: 1,
        email: account.email,
        role: account.roleName,
        sid: 7,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('fails closed when persisted permissions are missing', async () => {
    findCredentialsById.mockResolvedValue({
      ...account,
      permissionCodes: undefined,
    });

    await expect(
      strategy.validate({
        sub: 1,
        email: account.email,
        role: account.roleName,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('does not admit an active account whose persisted role is inactive', async () => {
    findCredentialsById.mockResolvedValueOnce({
      ...account,
      roleIsActive: false,
    });
    await expect(
      strategy.validate({ sub: 1, email: account.email, role: account.roleName, sessionGeneration: 0, sid: 7 }),
    ).resolves.toMatchObject({ canAccessErp: false });
  });

  it('fails authentication when permission lookup fails', async () => {
    const databaseError = new Error('database unavailable');
    findCredentialsById.mockRejectedValue(databaseError);

    const error: unknown = await strategy
      .validate({ sub: 1, email: account.email, role: account.roleName, sid: 7 })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(error).not.toBe(databaseError);
    expect((error as UnauthorizedException).getStatus()).toBe(401);
    expect((error as UnauthorizedException).message).toBe('Unauthorized');
  });

  it.each([
    ['foreign', { id: 7, userId: 2 }],
    ['revoked or expired', null],
  ])('rejects a %s session', async (_label, session) => {
    sessions.findActiveById.mockResolvedValueOnce(session);

    await expect(
      strategy.validate({
        sub: 1,
        email: account.email,
        role: account.roleName,
        sessionGeneration: 0,
        sid: 7,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('fails closed when session lookup fails', async () => {
    sessions.findActiveById.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(
      strategy.validate({
        sub: 1,
        email: account.email,
        role: account.roleName,
        sessionGeneration: 0,
        sid: 7,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
