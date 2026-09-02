import { AuditAction } from '../../../audit/audit-actions';
import { AuthApplicationError } from '../errors/auth.errors';
import { LoginUseCase } from './login.use-case';

const account = {
  id: 1,
  email: 'admin@example.com',
  fullName: 'Admin',
  status: 'ACTIVE',
  passwordHash: 'hashed-password',
  lockedAt: null,
  failedLoginAttempts: 0,
  lastLoginAt: null,
  roleName: 'Administrador',
  subscriptionExpirationDate: null,
};

describe('LoginUseCase', () => {
  const repository = {
    findCredentialsByEmail: jest.fn(),
    clearLockout: jest.fn(),
    recordFailedLogin: jest.fn(),
    recordLoginSuccess: jest.fn(),
    recordLoginSuccessAndCreateSession: jest.fn(),
  };
  const hasher = { hash: jest.fn(), compare: jest.fn() };
  const tokens = { sign: jest.fn() };
  const refreshTokens = { generate: jest.fn(), hash: jest.fn() };
  const audit = { record: jest.fn() };
  let useCase: LoginUseCase;

  beforeAll(() => {
    process.env.MAX_LOGIN_ATTEMPTS = '5';
    process.env.ACCOUNT_LOCKOUT_MINUTES = '30';
    process.env.REFRESH_TOKEN_TTL = '3600';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new LoginUseCase(
      repository as never,
      hasher,
      tokens,
      refreshTokens,
      audit,
    );
    repository.findCredentialsByEmail.mockResolvedValue(account);
    hasher.compare.mockResolvedValue(true);
    tokens.sign.mockResolvedValue('signed-token');
    refreshTokens.generate.mockReturnValue('raw-refresh-token');
    refreshTokens.hash.mockReturnValue('refresh-hash');
    repository.recordLoginSuccessAndCreateSession.mockResolvedValue(undefined);
    repository.recordFailedLogin.mockResolvedValue(false);
  });

  it('throws an application error for an unknown email', async () => {
    repository.findCredentialsByEmail.mockResolvedValueOnce(null);

    await expect(
      useCase.execute('ghost@example.com', 'secret'),
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid credentials',
    } satisfies Partial<AuthApplicationError>);
    expect(audit.record).toHaveBeenCalledWith({
      action: AuditAction.LOGIN_FAILED,
      module: 'AUTH',
    });
  });

  it('throws an application error when the account is not ACTIVE', async () => {
    repository.findCredentialsByEmail.mockResolvedValueOnce({
      ...account,
      status: 'INACTIVE',
    });

    await expect(
      useCase.execute('admin@example.com', 'secret'),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(hasher.compare).not.toHaveBeenCalled();
  });

  it('denies an expired Subscription_L1 after valid credentials with 403 error code', async () => {
    repository.findCredentialsByEmail.mockResolvedValueOnce({
      ...account,
      roleName: 'Subscription_L1',
      subscriptionExpirationDate: new Date(Date.now() - 1),
    });

    await expect(
      useCase.execute('admin@example.com', 'secret'),
    ).rejects.toMatchObject({ code: 'SUBSCRIPTION_EXPIRED' });
    expect(hasher.compare).toHaveBeenCalledWith('secret', 'hashed-password');
    expect(tokens.sign).not.toHaveBeenCalled();
  });

  it('throws an application error when the account has no password hash', async () => {
    repository.findCredentialsByEmail.mockResolvedValueOnce({
      ...account,
      passwordHash: null,
    });

    await expect(
      useCase.execute('admin@example.com', 'secret'),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('throws an application error while a temporary lock is active', async () => {
    repository.findCredentialsByEmail.mockResolvedValueOnce({
      ...account,
      lockedAt: new Date(),
    });

    await expect(
      useCase.execute('admin@example.com', 'secret'),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(audit.record).toHaveBeenCalledWith({
      userId: 1,
      action: AuditAction.LOGIN_FAILED,
      module: 'AUTH',
    });
    expect(repository.clearLockout).not.toHaveBeenCalled();
  });

  it('clears an expired lock before verifying the password', async () => {
    repository.findCredentialsByEmail.mockResolvedValueOnce({
      ...account,
      lockedAt: new Date(Date.now() - 60 * 60_000),
    });

    await useCase.execute('admin@example.com', 'secret');

    expect(repository.clearLockout).toHaveBeenCalledWith(1);
  });

  it('records the failed attempt and throws for a wrong password', async () => {
    hasher.compare.mockResolvedValueOnce(false);

    await expect(
      useCase.execute('admin@example.com', 'wrong'),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(repository.recordFailedLogin).toHaveBeenCalledWith(1, 5);
    expect(audit.record).toHaveBeenCalledWith({
      userId: 1,
      action: AuditAction.LOGIN_FAILED,
      module: 'AUTH',
    });
  });

  it('records the account lock event when the threshold is reached', async () => {
    hasher.compare.mockResolvedValueOnce(false);
    repository.recordFailedLogin.mockResolvedValueOnce(true);

    await expect(
      useCase.execute('admin@example.com', 'wrong'),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(audit.record).toHaveBeenCalledWith({
      userId: 1,
      action: AuditAction.ACCOUNT_LOCKED,
      module: 'AUTH',
      entityType: 'User',
      entityId: 1,
    });
  });

  it('signs a token, persists only the refresh hash, and audits on success', async () => {
    const result = await useCase.execute('admin@example.com', 'secret', {
      ipAddress: '127.0.0.1',
    });

    expect(tokens.sign).toHaveBeenCalledWith({
      sub: 1,
      email: 'admin@example.com',
      role: 'Administrador',
    });
    expect(repository.recordLoginSuccessAndCreateSession).toHaveBeenCalledWith(
      1,
      'refresh-hash',
      expect.any(Date),
    );
    expect(audit.record).toHaveBeenCalledWith({
      userId: 1,
      action: AuditAction.LOGIN_SUCCESS,
      module: 'AUTH',
      entityType: 'User',
      entityId: 1,
      ipAddress: '127.0.0.1',
    });
    expect(result).toEqual({
      accessToken: 'signed-token',
      refreshToken: 'raw-refresh-token',
      user: {
        id: 1,
        fullName: 'Admin',
        email: 'admin@example.com',
        status: 'ACTIVE',
        role: 'Administrador',
      },
    });
  });

  it('delivers login credentials when the post-commit audit fails', async () => {
    audit.record.mockRejectedValueOnce(new Error('audit unavailable'));

    await expect(
      useCase.execute('admin@example.com', 'secret'),
    ).resolves.toEqual(
      expect.objectContaining({
        accessToken: 'signed-token',
        refreshToken: 'raw-refresh-token',
      }),
    );
  });
});
