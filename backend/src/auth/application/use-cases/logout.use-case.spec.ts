import { LogoutUseCase } from './logout.use-case';

describe('LogoutUseCase', () => {
  const sessions = {
    findByRefreshTokenHash: jest.fn(),
    revoke: jest.fn(),
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
    sessions.revoke.mockResolvedValue(true);
  });

  it('revokes an identified session without exposing credential state', async () => {
    await expect(useCase.execute('raw-refresh')).resolves.toEqual({
      message: 'Logged out',
    });
    expect(sessions.revoke).toHaveBeenCalledWith(
      1,
      'logout',
    );
  });

  it('is idempotent for missing or invalid credentials', async () => {
    await expect(useCase.execute(undefined)).resolves.toEqual({
      message: 'Logged out',
    });
    sessions.revoke.mockResolvedValueOnce(false);
    await expect(useCase.execute('invalid')).resolves.toEqual({
      message: 'Logged out',
    });
  });

  it('revokes the bearer-identified session when the refresh cookie is absent', async () => {
    await expect(useCase.execute(undefined, {}, 3)).resolves.toEqual({
      message: 'Logged out',
    });
    expect(sessions.revoke).toHaveBeenCalledWith(3, 'logout');
  });

  it('fails closed when cookie and authenticated sessions differ', async () => {
    await expect(useCase.execute('raw-refresh', {}, 3)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(sessions.revoke).not.toHaveBeenCalled();
  });

  it('returns success when post-revocation audit persistence fails', async () => {
    audit.record.mockRejectedValueOnce(new Error('audit unavailable'));

    await expect(useCase.execute('raw-refresh')).resolves.toEqual({
      message: 'Logged out',
    });
  });
});
