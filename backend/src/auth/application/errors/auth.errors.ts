export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'PASSWORDS_DO_NOT_MATCH'
  | 'INVALID_ACTIVATION_TOKEN'
  | 'ACTIVATION_TOKEN_USED'
  | 'ACTIVATION_TOKEN_EXPIRED'
  | 'ACCOUNT_CANNOT_BE_ACTIVATED'
  | 'ACTIVATION_TOKEN_NO_LONGER_VALID'
  | 'INVALID_RESET_TOKEN'
  | 'RESET_TOKEN_USED'
  | 'RESET_TOKEN_EXPIRED'
  | 'RESET_TOKEN_NO_LONGER_VALID'
  | 'UNAUTHORIZED'
  | 'SUBSCRIPTION_EXPIRED'
  | 'CURRENT_PASSWORD_INCORRECT'
  | 'NEW_PASSWORD_MUST_DIFFER';

export class AuthApplicationError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AuthApplicationError';
  }
}
