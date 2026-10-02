import { HttpException } from '@nestjs/common';
import { AuthApplicationError } from '../../application/errors/auth.errors';
import { ActivateAccountUseCase } from '../../application/use-cases/activate-account.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { AuthController } from './auth.controller';

process.env.REFRESH_TOKEN_TTL = '3600';

describe('AuthController error boundary', () => {
  const request = {
    ip: '127.0.0.1',
    get: () => 'test-agent',
  } as never;
  const response = { cookie: jest.fn() } as never;

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
          response,
        ),
      401,
      'Invalid credentials',
    );
  });

  it('exposes persisted permission codes in login response', async () => {
    const { controller, loginUseCase } = createController();
    loginUseCase.execute.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 1,
        fullName: 'Admin',
        email: 'admin@example.com',
        status: 'ACTIVE',
        role: 'Administrador',
        permissionCodes: ['usr.users.read'],
        canAccessErp: true,
      },
    });

    const result = await controller.login(
      { email: 'admin@example.com', password: 'secret' },
      request,
      response,
    );

    expect(result.user).toEqual({
      id: 1,
      fullName: 'Admin',
      email: 'admin@example.com',
      status: 'ACTIVE',
      role: 'Administrador',
      permissionCodes: ['usr.users.read'],
      canAccessErp: true,
    });
  });

  it('exposes persisted permission codes in auth/me response', () => {
    const { controller } = createController();

    expect(
      controller.me({
        user: {
          id: 1,
          fullName: 'Admin',
          email: 'admin@example.com',
          status: 'ACTIVE',
          role: 'Administrador',
          permissionCodes: ['usr.users.read'],
          canAccessErp: true,
        },
      } as never),
    ).toEqual({
      id: 1,
      fullName: 'Admin',
      email: 'admin@example.com',
      status: 'ACTIVE',
      role: 'Administrador',
      permissionCodes: ['usr.users.read'],
      canAccessErp: true,
    });
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
