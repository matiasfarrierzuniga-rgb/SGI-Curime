import { HttpException } from '@nestjs/common';
import { AuthApplicationError } from '../../application/errors/auth.errors';
import { ActivateAccountUseCase } from '../../application/use-cases/activate-account.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { AuthController } from './auth.controller';

describe('AuthController error boundary', () => {
  const request = {
    ip: '127.0.0.1',
    get: () => 'test-agent',
  } as never;

  function createController() {
    const loginUseCase = {
      execute: jest.fn<
        ReturnType<LoginUseCase['execute']>,
        Parameters<LoginUseCase['execute']>
      >(),
    };
    const refreshSessionUseCase = { execute: jest.fn() };
    const logoutUseCase = { execute: jest.fn() };
    const activateAccountUseCase = {
      execute: jest.fn<
        ReturnType<ActivateAccountUseCase['execute']>,
        Parameters<ActivateAccountUseCase['execute']>
      >(),
    };
    const requestPasswordResetUseCase = { execute: jest.fn() };
    const resetPasswordUseCase = {
      execute: jest.fn<
        ReturnType<ResetPasswordUseCase['execute']>,
        Parameters<ResetPasswordUseCase['execute']>
      >(),
    };
    const changePasswordUseCase = { execute: jest.fn() };

    return {
      controller: new AuthController(
        loginUseCase as never,
        refreshSessionUseCase as never,
        logoutUseCase as never,
        activateAccountUseCase as never,
        requestPasswordResetUseCase as never,
        resetPasswordUseCase as never,
        changePasswordUseCase as never,
      ),
      loginUseCase,
      activateAccountUseCase,
      resetPasswordUseCase,
    };
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
    const { controller, loginUseCase } = createController();
    loginUseCase.execute.mockRejectedValue(
      new AuthApplicationError('INVALID_CREDENTIALS', 'Invalid credentials'),
    );

    await expectHttpError(
      () =>
        controller.login(
          { email: 'user@example.com', password: 'bad' },
          request,
        ),
      401,
      'Invalid credentials',
    );
  });

  it('maps invalid activation input to the existing 400 response', async () => {
    const { controller, activateAccountUseCase } = createController();
    activateAccountUseCase.execute.mockRejectedValue(
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
    const { controller, resetPasswordUseCase } = createController();
    resetPasswordUseCase.execute.mockRejectedValue(
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
