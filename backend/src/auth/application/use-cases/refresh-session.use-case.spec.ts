import { AuditAction } from '../../../audit/audit-actions';
import { RefreshSessionUseCase } from './refresh-session.use-case';

const session = {
  id: 4,
  userId: 1,
  refreshTokenHash: 'current-hash',
  createdAt: new Date('2026-09-01T10:00:00.000Z'),
  expiresAt: new Date('2030-09-01T10:00:00.000Z'),
  revokedAt: null,
  revocationReason: null,
};
const user = {
  id: 1,
  email: 'admin@example.com',
  roleName: 'Administrador',
  status: 'ACTIVE',
  subscriptionExpirationDate: null,
};

describe('RefreshSessionUseCase', () => {
  const sessions = {
    findByRefreshTokenHash: jest.fn(),
    isActive: jest.fn(),
    rotate: jest.fn(),
  };
  const refreshTokens = { generate: jest.fn(), hash: jest.fn() };
  const users = { findCredentialsById: jest.fn() };
  const tokens = { sign: jest.fn() };
  const audit = { record: jest.fn() };
  let useCase: RefreshSessionUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RefreshSessionUseCase(
      sessions as never,
      refreshTokens,
      users as never,
      tokens,
      audit,
    );
    refreshTokens.hash.mockImplementation((value: string) => `${value}-hash`);
    refreshTokens.generate.mockReturnValue('next-raw');
    sessions.findByRefreshTokenHash.mockResolvedValue(session);
    sessions.isActive.mockReturnValue(true);
    sessions.rotate.mockResolvedValue(true);
    users.findCredentialsById.mockResolvedValue(user);
    tokens.sign.mockResolvedValue('next-access');
  });

  it('rotates a valid refresh credential and signs with the current role', async () => {
    await expect(useCase.execute('current-raw')).resolves.toEqual({
      accessToken: 'next-access',
      refreshToken: 'next-raw',
      sessionExpiresAt: session.expiresAt,
    });
    expect(sessions.rotate).toHaveBeenCalledWith(
      4,
      'current-raw-hash',
      'next-raw-hash',
      expect.any(Date),
    );
    expect(tokens.sign).toHaveBeenCalledWith({
      sub: 1,
      email: 'admin@example.com',
      role: 'Administrador',
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.REFRESH_SUCCESS }),
    );
  });

  it('delivers rotated credentials when success audit persistence fails', async () => {
    audit.record.mockRejectedValueOnce(new Error('audit unavailable'));

    await expect(useCase.execute('current-raw')).resolves.toMatchObject({
      accessToken: 'next-access',
      refreshToken: 'next-raw',
    });
  });

  it.each([
    ['missing credential', undefined],
    ['unknown credential', 'unknown-raw'],
  ])('returns a generic failure for %s', async (_label, rawToken) => {
    if (rawToken) sessions.findByRefreshTokenHash.mockResolvedValueOnce(null);

    await expect(useCase.execute(rawToken)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Unauthorized',
    });
    expect(tokens.sign).not.toHaveBeenCalled();
  });

  it('denies inactive users without rotating the session', async () => {
    users.findCredentialsById.mockResolvedValueOnce({
      ...user,
      status: 'INACTIVE',
    });

    await expect(useCase.execute('current-raw')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(sessions.rotate).not.toHaveBeenCalled();
  });

  it('denies expired Subscription_L1 users without rotating the session', async () => {
    users.findCredentialsById.mockResolvedValueOnce({
      ...user,
      roleName: 'Subscription_L1',
      subscriptionExpirationDate: new Date(Date.now() - 1),
    });

    await expect(useCase.execute('current-raw')).rejects.toMatchObject({
      code: 'SUBSCRIPTION_EXPIRED',
    });
    expect(sessions.rotate).not.toHaveBeenCalled();
  });

  it('denies an expired session without rotating or issuing credentials', async () => {
    sessions.isActive.mockReturnValueOnce(false);

    await expect(useCase.execute('current-raw')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(sessions.rotate).not.toHaveBeenCalled();
    expect(tokens.sign).not.toHaveBeenCalled();
  });

  it('denies the losing request when compare-and-swap rotation affects no row', async () => {
    sessions.rotate.mockResolvedValueOnce(false);

    await expect(useCase.execute('current-raw')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});
