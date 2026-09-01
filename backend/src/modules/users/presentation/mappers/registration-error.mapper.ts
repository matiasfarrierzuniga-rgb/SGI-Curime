import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { RegistrationConflictError } from '../../domain/errors/registration-conflict.error';
import { RegistrationRoleUnavailableError } from '../../domain/errors/registration-role-unavailable.error';

export function toRegistrationHttpError(error: unknown): never {
  if (error instanceof RegistrationConflictError) {
    throw new BadRequestException(error.message);
  }
  if (error instanceof RegistrationRoleUnavailableError) {
    throw new InternalServerErrorException(error.message);
  }
  throw error;
}
