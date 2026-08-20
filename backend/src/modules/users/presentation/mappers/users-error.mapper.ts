import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EmptyUpdateError } from '../../domain/errors/empty-update.error';
import { RoleNotFoundError } from '../../domain/errors/role-not-found.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';

export function toHttpError(error: unknown): never {
  if (
    error instanceof UserNotFoundError ||
    error instanceof RoleNotFoundError
  ) {
    throw new NotFoundException(error.message);
  }
  if (error instanceof EmptyUpdateError) {
    throw new BadRequestException(error.message);
  }
  throw new ConflictException(
    error instanceof Error ? error.message : 'Unexpected error',
  );
}
