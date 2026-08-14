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
import { AuthService } from './auth.service';
import { Roles } from './decorators/roles.decorator';
import { LoginDto } from './dto/login.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { AccountActivationService } from './account-activation.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PasswordRecoveryService } from './password-recovery.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly accountActivationService: AccountActivationService,
    private readonly passwordRecoveryService: PasswordRecoveryService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto, @Req() request: Request) {
    return this.authService.login(loginDto, this.context(request));
  }

  @Post('activate-account')
  @HttpCode(HttpStatus.OK)
  activateAccount(@Body() dto: ActivateAccountDto, @Req() request: Request) {
    return this.accountActivationService.activate(dto, this.context(request));
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordRecoveryService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    return this.passwordRecoveryService.resetPassword(dto, this.context(request));
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.passwordRecoveryService.changePassword(request.user.id, dto, this.context(request));
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
  private context(request: Request) { return { ipAddress: request.ip, userAgent: request.get('user-agent') }; }
}
