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
  roleName: 'Administrador',
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
  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(repository);
    findCredentialsById.mockResolvedValue(account);
  });

  it('returns persisted permission codes without changing authentication fields', async () => {
    await expect(
      strategy.validate({
        sub: 1,
        email: account.email,
        role: account.roleName,
      }),
    ).resolves.toEqual({
      id: 1,
      fullName: 'Admin',
      email: 'admin@example.com',
      status: 'ACTIVE',
      role: 'Administrador',
      permissionCodes: ['usr.users.read'],
      canAccessErp: true,
    });
    expect(findCredentialsById).toHaveBeenCalledWith(1);
  });

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
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      strategy.validate({
        sub: 1,
        email: account.email,
        role: account.roleName,
        iat: 2000,
        sessionGeneration: 1,
      }),
    ).resolves.toBeDefined();
  });

  it('accepts historical tokens only before the first deactivation', async () => {
    await expect(
      strategy.validate({
        sub: 1,
        email: account.email,
        role: account.roleName,
      }),
    ).resolves.toBeDefined();
    findCredentialsById.mockResolvedValue({
      ...account,
      sessionGeneration: 1,
    });
    await expect(
      strategy.validate({
        sub: 1,
        email: account.email,
        role: account.roleName,
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

  it('fails authentication when permission lookup fails', async () => {
    const databaseError = new Error('database unavailable');
    findCredentialsById.mockRejectedValue(databaseError);

    const error: unknown = await strategy
      .validate({ sub: 1, email: account.email, role: account.roleName })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(error).not.toBe(databaseError);
    expect((error as UnauthorizedException).getStatus()).toBe(401);
    expect((error as UnauthorizedException).message).toBe('Unauthorized');
  });
});
