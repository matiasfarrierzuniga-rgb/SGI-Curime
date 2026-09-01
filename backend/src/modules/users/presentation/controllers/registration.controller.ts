import { Body, Controller, Post } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { RegisterUserDto } from '../dto/register-user.dto';
import { toRegistrationHttpError } from '../mappers/registration-error.mapper';
import { toUserResponse } from '../mappers/user-response.mapper';

@Controller()
export class RegistrationController {
  constructor(private readonly registerUser: RegisterUserUseCase) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  async register(@Body() dto: RegisterUserDto) {
    try {
      return toUserResponse(await this.registerUser.execute(dto));
    } catch (error) {
      toRegistrationHttpError(error);
    }
  }
}
