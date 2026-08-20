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
    });
    repository.invalidateAndCreateResetToken.mockResolvedValue(undefined);
    delivery.deliver.mockResolvedValue(undefined);
  });

  it('returns the generic response and sends nothing for an unknown email', async () => {
    repository.findCredentialsByEmail.mockResolvedValueOnce(null);

    await expect(useCase.execute('ghost@example.com')).resolves.toEqual({
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
    );
    expect(delivery.deliver).toHaveBeenCalledWith({
      email: 'user@example.com',
      fullName: 'User',
      token: anyToken,
      expiresAt: anyDate,
    });
    expect(result).toEqual({ message: GENERIC_RESPONSE });
  });
});
