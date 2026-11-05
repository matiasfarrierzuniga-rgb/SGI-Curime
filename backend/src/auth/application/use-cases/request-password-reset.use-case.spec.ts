import { RequestPasswordResetUseCase } from './request-password-reset.use-case';

const GENERIC_RESPONSE =
  'If the email is registered, password reset instructions will be sent.';

const anyDate = expect.any(Date) as unknown as Date;
const anyToken = expect.stringMatching(/^[\w-]+$/) as unknown as string;
describe('RequestPasswordResetUseCase', () => {
  const repository = {
    findCredentialsByEmail: jest.fn(),
    invalidateAndCreateResetToken: jest.fn(),
  };
  const delivery = { deliver: jest.fn() };
  let useCase: RequestPasswordResetUseCase;

  beforeAll(() => {
    process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = '60';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RequestPasswordResetUseCase(repository as never, delivery);
    repository.findCredentialsByEmail.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      fullName: 'User',
      status: 'ACTIVE',
    });
    repository.invalidateAndCreateResetToken.mockResolvedValue(true);
    delivery.deliver.mockResolvedValue(undefined);
  });

  it('returns the generic response and sends nothing for an unknown email', async () => {
    repository.findCredentialsByEmail.mockResolvedValueOnce(null);

    await expect(useCase.execute('ghost@example.com')).resolves.toEqual({
      message: GENERIC_RESPONSE,
    });
    expect(delivery.deliver).not.toHaveBeenCalled();
  });

  it.each(['PENDING_EMAIL_VERIFICATION', 'INACTIVE', 'BLOCKED'])(
    'does not issue reset tokens for %s',
    async (status) => {
      repository.findCredentialsByEmail.mockResolvedValueOnce({
        id: 1,
        email: 'user@example.com',
        status,
      });
      await expect(useCase.execute('user@example.com')).resolves.toEqual({
        message: GENERIC_RESPONSE,
      });
      expect(repository.invalidateAndCreateResetToken).not.toHaveBeenCalled();
      expect(delivery.deliver).not.toHaveBeenCalled();
    },
  );

  it('does not send when the account changed during token creation', async () => {
    repository.invalidateAndCreateResetToken.mockResolvedValueOnce(false);
    await expect(useCase.execute('user@example.com')).resolves.toEqual({
      message: GENERIC_RESPONSE,
    });
    expect(delivery.deliver).not.toHaveBeenCalled();
  });

  it('creates a reset token and delivers it', async () => {
    const result = await useCase.execute('user@example.com');

    expect(repository.invalidateAndCreateResetToken).toHaveBeenCalledWith(
      1,
      expect.stringMatching(/^[0-9a-f]{64}$/),
      anyDate,
      'user@example.com',
    );
    expect(delivery.deliver).toHaveBeenCalledWith({
      email: 'user@example.com',
      fullName: 'User',
      token: anyToken,
      expiresAt: anyDate,
    });
    expect(result).toEqual({ message: GENERIC_RESPONSE });
  });

  it('does not make the public response wait for the mail provider', async () => {
    let completeDelivery!: () => void;
    delivery.deliver.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        completeDelivery = resolve;
      }),
    );

    await expect(useCase.execute('user@example.com')).resolves.toEqual({
      message: GENERIC_RESPONSE,
    });
    expect(delivery.deliver).toHaveBeenCalledTimes(1);
    completeDelivery();
  });
});
