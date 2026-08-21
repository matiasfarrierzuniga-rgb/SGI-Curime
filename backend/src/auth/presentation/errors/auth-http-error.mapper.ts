import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthApplicationError } from '../../application/errors/auth.errors';

export function toAuthHttpError(error: AuthApplicationError) {
  switch (error.code) {
    case 'INVALID_CREDENTIALS':
    case 'UNAUTHORIZED':
    case 'CURRENT_PASSWORD_INCORRECT':
      return new UnauthorizedException(error.message);
    case 'PASSWORDS_DO_NOT_MATCH':
    case 'INVALID_ACTIVATION_TOKEN':
    case 'ACTIVATION_TOKEN_EXPIRED':
    case 'INVALID_RESET_TOKEN':
    case 'RESET_TOKEN_EXPIRED':
      return new BadRequestException(error.message);
    case 'ACTIVATION_TOKEN_USED':
    case 'ACCOUNT_CANNOT_BE_ACTIVATED':
    case 'ACTIVATION_TOKEN_NO_LONGER_VALID':
    case 'RESET_TOKEN_USED':
    case 'RESET_TOKEN_NO_LONGER_VALID':
    case 'NEW_PASSWORD_MUST_DIFFER':
      return new ConflictException(error.message);
  }
}
