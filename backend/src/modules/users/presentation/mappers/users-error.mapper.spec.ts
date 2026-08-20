import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AccountAlreadyActiveError } from '../../domain/errors/account-already-active.error';
import { EmptyUpdateError } from '../../domain/errors/empty-update.error';
import { RoleNotFoundError } from '../../domain/errors/role-not-found.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { toHttpError } from './users-error.mapper';

describe('users-error.mapper', () => {
  it('maps UserNotFoundError to 404', () => {
    expect(() => toHttpError(new UserNotFoundError())).toThrow(
      NotFoundException,
    );
  });

  it('maps RoleNotFoundError to 404', () => {
    expect(() => toHttpError(new RoleNotFoundError())).toThrow(
      NotFoundException,
    );
  });

  it('maps EmptyUpdateError to 400', () => {
    expect(() => toHttpError(new EmptyUpdateError())).toThrow(
      BadRequestException,
    );
  });

  it('maps business errors to 409 with their message', () => {
    try {
      toHttpError(new AccountAlreadyActiveError());
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).message).toBe(
        'User is already active',
      );
      return;
    }
    throw new Error('expected toHttpError to throw');
  });
});
