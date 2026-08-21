import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../domain/entities/auth-user';
import { ActivateAccountUseCase } from '../../application/use-cases/activate-account.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RequestPasswordResetUseCase } from '../../application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { AuthApplicationError } from '../../application/errors/auth.errors';
import { Roles } from '../decorators/roles.decorator';
import { ActivateAccountDto } from '../dto/activate-account.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { toAuthHttpError } from '../errors/auth-http-error.mapper';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly activateAccountUseCase: ActivateAccountUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto, @Req() request: Request) {
    return this.handle(() =>
      this.loginUseCase.execute(
        loginDto.email,
        loginDto.password,
        this.context(request),
      ),
    );
  }

  @Post('activate-account')
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

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.handle(() =>
      this.requestPasswordResetUseCase.execute(dto.email),
    );
  }

  @Post('reset-password')
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

  @Patch('change-password')
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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest): AuthenticatedUser {
    return request.user;
  }

  @Get('admin-test')
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
