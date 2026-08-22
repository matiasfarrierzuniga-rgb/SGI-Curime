import { HttpException } from '@nestjs/common';
import { AuthApplicationError } from '../../application/errors/auth.errors';
import { AuthController } from './auth.controller';

describe('AuthController error boundary', () => {
  const request = {
    ip: '127.0.0.1',
    get: () => 'test-agent',
  } as never;

  function createController() {
    return new AuthController(
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
    );
  }

  async function expectHttpError(
    operation: () => Promise<unknown>,
    status: number,
    message: string,
  ) {
    try {
      await operation();
      fail('Expected operation to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(status);
      expect((error as HttpException).getResponse()).toEqual(
        expect.objectContaining({ statusCode: status, message }),
      );
    }
  }

  it('maps invalid credentials to the existing 401 response', async () => {
    const controller = createController();
    const login = controller['loginUseCase'] as { execute: jest.Mock };
    login.execute.mockRejectedValue(
      new AuthApplicationError('INVALID_CREDENTIALS', 'Invalid credentials'),
    );

    await expectHttpError(
      () => controller.login({ email: 'user@example.com', password: 'bad' }, request),
      401,
      'Invalid credentials',
    );
  });

  it('maps invalid activation input to the existing 400 response', async () => {
    const controller = createController();
    const activation = controller['activateAccountUseCase'] as {
      execute: jest.Mock;
    };
    activation.execute.mockRejectedValue(
      new AuthApplicationError(
        'ACTIVATION_TOKEN_EXPIRED',
        'Activation token has expired',
      ),
    );

    await expectHttpError(
      () =>
        controller.activateAccount(
          {
            token: 'token',
            password: 'Password1!',
            passwordConfirmation: 'Password1!',
          },
          request,
        ),
      400,
      'Activation token has expired',
    );
  });

  it('maps password conflicts to the existing 409 response', async () => {
    const controller = createController();
    const reset = controller['resetPasswordUseCase'] as { execute: jest.Mock };
    reset.execute.mockRejectedValue(
      new AuthApplicationError(
        'RESET_TOKEN_USED',
        'Reset token has already been used',
      ),
    );

    await expectHttpError(
      () =>
        controller.resetPassword(
          {
            token: 'token',
            password: 'Password1!',
            passwordConfirmation: 'Password1!',
          },
          request,
        ),
      409,
      'Reset token has already been used',
    );
  });
});
