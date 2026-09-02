import type {
  ActivationToken,
  AuthAccount,
  ResetToken,
} from '../../domain/entities/auth-account';

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');

export interface AuthTransaction {
  claimActivationToken(tokenId: number, now: Date): Promise<boolean>;
  activateUser(userId: number, passwordHash: string): Promise<boolean>;
  claimResetToken(tokenId: number, now: Date): Promise<boolean>;
  setUserPassword(userId: number, passwordHash: string): Promise<void>;
  revokeUserSessions(userId: number, reason: string): Promise<number>;
}

export interface AuthRepository {
  findCredentialsByEmail(email: string): Promise<AuthAccount | null>;
  findCredentialsById(id: number): Promise<AuthAccount | null>;
  findActivationToken(tokenHash: string): Promise<ActivationToken | null>;
  findResetToken(tokenHash: string): Promise<ResetToken | null>;
  recordFailedLogin(id: number, maxAttempts: number): Promise<boolean>;
  clearLockout(id: number): Promise<void>;
  recordLoginSuccess(id: number): Promise<void>;
  recordLoginSuccessAndCreateSession(
    id: number,
    refreshTokenHash: string,
    expiresAt: Date,
  ): Promise<void>;
  invalidateAndCreateResetToken(
    userId: number,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void>;
  updatePassword(id: number, passwordHash: string): Promise<void>;
  withTransaction<T>(work: (tx: AuthTransaction) => Promise<T>): Promise<T>;
}
