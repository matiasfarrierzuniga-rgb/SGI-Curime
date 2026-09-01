import { LogoutUseCase } from './logout.use-case';

describe('LogoutUseCase', () => {
  const sessions = {
    findByRefreshTokenHash: jest.fn(),
    revokeByRefreshTokenHash: jest.fn(),
  };
  const refreshTokens = { hash: jest.fn() };
  const audit = { record: jest.fn() };
  let useCase: LogoutUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new LogoutUseCase(
      sessions as never,
      refreshTokens as never,
      audit,
    );
    refreshTokens.hash.mockReturnValue('refresh-hash');
    sessions.findByRefreshTokenHash.mockResolvedValue({ id: 1, userId: 2 });
    sessions.revokeByRefreshTokenHash.mockResolvedValue(true);
  });

  it('revokes an identified session without exposing credential state', async () => {
    await expect(useCase.execute('raw-refresh')).resolves.toEqual({
      message: 'Logged out',
    });
    expect(sessions.revokeByRefreshTokenHash).toHaveBeenCalledWith(
      'refresh-hash',
      'logout',
    );
  });

  it('is idempotent for missing or invalid credentials', async () => {
    await expect(useCase.execute(undefined)).resolves.toEqual({
      message: 'Logged out',
    });
    sessions.revokeByRefreshTokenHash.mockResolvedValueOnce(false);
    await expect(useCase.execute('invalid')).resolves.toEqual({
      message: 'Logged out',
    });
  });

  it('returns success when post-revocation audit persistence fails', async () => {
    audit.record.mockRejectedValueOnce(new Error('audit unavailable'));

    await expect(useCase.execute('raw-refresh')).resolves.toEqual({
      message: 'Logged out',
    });
  });
});
