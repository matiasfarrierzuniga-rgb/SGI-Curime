import type { Session } from '../../domain/entities/session';

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');

export interface CreateSessionInput {
  userId: number;
  refreshTokenHash: string;
  expiresAt: Date;
}

export interface SessionRepository {
  create: (input: CreateSessionInput) => Promise<Session>;
  findById: (id: number) => Promise<Session | null>;
  findByRefreshTokenHash: (refreshTokenHash: string) => Promise<Session | null>;
  findActiveById: (id: number, now: Date) => Promise<Session | null>;
  rotate: (
    id: number,
    currentRefreshTokenHash: string,
    nextRefreshTokenHash: string,
    now: Date,
  ) => Promise<boolean>;
  revoke: (
    id: number,
    revokedAt: Date,
    reason: string | null,
  ) => Promise<boolean>;
  revokeByRefreshTokenHash: (
    refreshTokenHash: string,
    revokedAt: Date,
    reason: string | null,
  ) => Promise<boolean>;
  revokeAllForUser: (
    userId: number,
    revokedAt: Date,
    reason: string | null,
  ) => Promise<number>;
}
