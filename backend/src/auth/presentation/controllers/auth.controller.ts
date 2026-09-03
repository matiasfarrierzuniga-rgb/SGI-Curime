import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { AuthenticatedUser } from '../../domain/entities/auth-user';
import { ActivateAccountUseCase } from '../../application/use-cases/activate-account.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RefreshSessionUseCase } from '../../application/use-cases/refresh-session.use-case';
import { getRefreshCookiePolicy } from '../../application/config/refresh-token.config';
import { RequestPasswordResetUseCase } from '../../application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { AuthApplicationError } from '../../application/errors/auth.errors';
import { Roles } from '../decorators/roles.decorator';
import { ActivateAccountDto } from '../dto/activate-account.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { toAuthHttpError } from '../errors/auth-http-error.mapper';
import { assertCookieRequestOrigin } from '../security/cookie-origin.policy';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller()
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly activateAccountUseCase: ActivateAccountUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Post(['auth/login', 'login'])
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.handle(() =>
      this.loginUseCase.execute(
        loginDto.email,
        loginDto.password,
        this.context(request),
      ),
    );
    this.setRefreshCookie(response, result.refreshToken);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }

  @Post(['auth/refresh', 'refresh'])
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = refreshTokenFrom(request, dto);
    if (refreshTokenFromCookie(request, getRefreshCookiePolicy().name)) {
      assertCookieRequestOrigin(request);
    }
    const result = await this.handle(() =>
      this.refreshSessionUseCase.execute(refreshToken, this.context(request)),
    );
    if (result.sessionExpiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Unauthorized');
    }
    this.setRefreshCookie(
      response,
      result.refreshToken,
      result.sessionExpiresAt,
    );
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post(['auth/logout', 'logout'])
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const policy = getRefreshCookiePolicy();
    const refreshToken = refreshTokenFrom(request, dto);
    if (refreshTokenFromCookie(request, policy.name)) {
      assertCookieRequestOrigin(request);
    }
    try {
      return await this.logoutUseCase.execute(
        refreshToken,
        this.context(request),
      );
    } finally {
      response.clearCookie(policy.name, {
        ...policy.options,
        maxAge: undefined,
      });
    }
  }

  @Post('auth/activate-account')
  @HttpCode(HttpStatus.OK)
  activateAccount(@Body() dto: ActivateAccountDto, @Req() request: Request) {
    return this.handle(() =>
      this.activateAccountUseCase.execute(
        dto.token,
        dto.password,
        dto.passwordConfirmation,
        this.context(request),
      ),
    );
  }

  @Post('auth/forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.handle(() =>
      this.requestPasswordResetUseCase.execute(dto.email),
    );
  }

  @Post('auth/reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    return this.handle(() =>
      this.resetPasswordUseCase.execute(
        dto.token,
        dto.password,
        dto.passwordConfirmation,
        this.context(request),
      ),
    );
  }

  @Patch('auth/change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.handle(() =>
      this.changePasswordUseCase.execute(
        request.user.id,
        dto.currentPassword,
        dto.newPassword,
        dto.newPasswordConfirmation,
        this.context(request),
      ),
    );
  }

  @Get('auth/me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest): AuthenticatedUser {
    return request.user;
  }

  @Get('auth/admin-test')
  @Roles('Administrador')
  @UseGuards(JwtAuthGuard, RolesGuard)
  adminTest() {
    return { message: 'Administrator access granted.' };
  }

  private context(request: Request) {
    return {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    };
  }

  private setRefreshCookie(
    response: Response,
    refreshToken: string,
    expiresAt?: Date,
  ): void {
    const policy = getRefreshCookiePolicy(expiresAt);
    response.cookie(policy.name, refreshToken, policy.options);
  }

  private async handle<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof AuthApplicationError) {
        throw toAuthHttpError(error);
      }
      throw error;
    }
  }
}

function refreshTokenFrom(
  request: Request,
  dto: RefreshTokenDto,
): string | undefined {
  return (
    refreshTokenFromCookie(request, getRefreshCookiePolicy().name) ??
    dto.refreshToken
  );
}

function refreshTokenFromCookie(
  request: Request,
  name: string,
): string | undefined {
  const cookies: unknown = request.cookies;
  if (!cookies || typeof cookies !== 'object') return undefined;
  const value = (cookies as Record<string, unknown>)[name];
  return typeof value === 'string' ? value : undefined;
}
