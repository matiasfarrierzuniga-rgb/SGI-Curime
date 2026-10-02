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
};

describe('JwtStrategy persisted RBAC mapping', () => {
  const repository = {
    findCredentialsById: jest.fn(),
    clearLockout: jest.fn(),
  } as unknown as AuthRepository;
  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(repository);
    repository.findCredentialsById = jest.fn().mockResolvedValue(account);
  });

  it('returns persisted permission codes without changing authentication fields', async () => {
    await expect(strategy.validate({ sub: 1, email: account.email, role: account.roleName })).resolves.toEqual({
      id: 1,
      fullName: 'Admin',
      email: 'admin@example.com',
      status: 'ACTIVE',
      role: 'Administrador',
      permissionCodes: ['usr.users.read'],
      canAccessErp: true,
    });
    expect(repository.findCredentialsById).toHaveBeenCalledWith(1);
  });

  it('fails closed when persisted permissions are missing', async () => {
    repository.findCredentialsById = jest
      .fn()
      .mockResolvedValue({ ...account, permissionCodes: undefined });

    await expect(
      strategy.validate({ sub: 1, email: account.email, role: account.roleName }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('fails authentication when permission lookup fails', async () => {
    const databaseError = new Error('database unavailable');
    repository.findCredentialsById = jest
      .fn()
      .mockRejectedValue(databaseError);

    const error = await strategy
      .validate({ sub: 1, email: account.email, role: account.roleName })
      .catch((caught) => caught);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(error).not.toBe(databaseError);
    expect((error as UnauthorizedException).getStatus()).toBe(401);
    expect((error as UnauthorizedException).message).toBe('Unauthorized');
  });
});
