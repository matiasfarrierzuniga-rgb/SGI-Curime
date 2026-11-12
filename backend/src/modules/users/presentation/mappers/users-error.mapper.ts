import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EmptyUpdateError } from '../../domain/errors/empty-update.error';
import { InvalidPhoneError } from '../../domain/errors/invalid-phone.error';
import { RoleNotFoundError } from '../../domain/errors/role-not-found.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { NonAssignableRoleError } from '../../domain/errors/non-assignable-role.error';
import { AccountPersonLinkConflictError } from '../../domain/errors/account-person-link-conflict.error';
import { PersonNotFoundError } from '../../domain/errors/person-not-found.error';
import { PersonRegistrationConflictError } from '../../domain/errors/person-registration-conflict.error';

export function toHttpError(error: unknown): never {
  if (
    error instanceof UserNotFoundError ||
    error instanceof RoleNotFoundError ||
    error instanceof PersonNotFoundError
  ) {
    throw new NotFoundException(error.message);
  }
  if (
    error instanceof EmptyUpdateError ||
    error instanceof InvalidPhoneError ||
    error instanceof NonAssignableRoleError
  ) {
    throw new BadRequestException(error.message);
  }
  if (
    error instanceof AccountPersonLinkConflictError ||
    error instanceof PersonRegistrationConflictError
  ) {
    throw new ConflictException(error.message);
  }
  throw new ConflictException(
    error instanceof Error ? error.message : 'Unexpected error',
  );
}
