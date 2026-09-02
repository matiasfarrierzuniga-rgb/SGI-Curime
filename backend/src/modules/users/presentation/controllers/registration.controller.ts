import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuthenticatedUser } from '../../../../auth';
import { OptionalJwtAuthGuard } from '../../../../auth/presentation/guards/optional-jwt-auth.guard';
import { RegisterAdministratorUseCase } from '../../application/use-cases/register-administrator.use-case';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { AdministratorRegistrationAuthenticationRequiredError } from '../../domain/errors/administrator-registration-authentication-required.error';
import { AdministratorRegistrationForbiddenError } from '../../domain/errors/administrator-registration-forbidden.error';
import { RegisterUserDto } from '../dto/register-user.dto';
import { toRegistrationHttpError } from '../mappers/registration-error.mapper';
import { toUserResponse } from '../mappers/user-response.mapper';

@Controller()
export class RegistrationController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly registerAdministratorUseCase: RegisterAdministratorUseCase,
  ) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  async register(@Body() dto: RegisterUserDto) {
    try {
      return toUserResponse(await this.registerUser.execute(dto));
    } catch (error) {
      toRegistrationHttpError(error);
    }
  }

  @Post('admin/register')
  @UseGuards(ThrottlerGuard, OptionalJwtAuthGuard)
  async registerAdministrator(
    @Body() dto: RegisterUserDto,
    @Req() request: Request & { user?: AuthenticatedUser },
  ) {
    try {
      return toUserResponse(
        await this.registerAdministratorUseCase.execute(dto, request.user),
      );
    } catch (error) {
      if (
        error instanceof AdministratorRegistrationAuthenticationRequiredError
      ) {
        throw new UnauthorizedException(error.message);
      }
      if (error instanceof AdministratorRegistrationForbiddenError) {
        throw new ForbiddenException(error.message);
      }
      toRegistrationHttpError(error);
    }
  }
}
