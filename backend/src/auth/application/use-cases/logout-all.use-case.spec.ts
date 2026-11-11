import { LogoutAllUseCase } from './logout-all.use-case';

describe('LogoutAllUseCase', () => {
  const transaction = { invalidateUserSessions: jest.fn() };
  const repository = {
    withTransaction: jest.fn(
      (work: (tx: typeof transaction) => unknown) => work(transaction),
    ),
  };
  const audit = { record: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    transaction.invalidateUserSessions.mockResolvedValue(2);
  });

  it('invalidates only the authenticated user sessions in one transaction', async () => {
    const useCase = new LogoutAllUseCase(repository as never, audit);

    await expect(useCase.execute(7)).resolves.toEqual({
      message: 'Logged out from all sessions',
    });
    expect(transaction.invalidateUserSessions).toHaveBeenCalledWith(7, 'logout-all');
    expect(repository.withTransaction).toHaveBeenCalledTimes(1);
  });
});
