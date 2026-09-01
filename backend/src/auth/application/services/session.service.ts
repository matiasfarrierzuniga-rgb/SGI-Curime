import { Inject, Injectable } from '@nestjs/common';
import type { Session } from '../../domain/entities/session';
import {
  SESSION_REPOSITORY,
  type CreateSessionInput,
  type SessionRepository,
} from '../ports/session-repository.port';

@Injectable()
export class SessionService {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessions: SessionRepository,
  ) {}

  create(input: CreateSessionInput): Promise<Session> {
    return this.sessions.create(input);
  }

  findById(id: number): Promise<Session | null> {
    return this.sessions.findById(id);
  }

  findByRefreshTokenHash(refreshTokenHash: string): Promise<Session | null> {
    return this.sessions.findByRefreshTokenHash(refreshTokenHash);
  }

  findActiveById(id: number, now = new Date()): Promise<Session | null> {
    return this.sessions.findActiveById(id, now);
  }

  isExpired(session: Session, now = new Date()): boolean {
    return session.expiresAt <= now;
  }

  isRevoked(session: Session): boolean {
    return session.revokedAt !== null;
  }

  isActive(session: Session, now = new Date()): boolean {
    return !this.isRevoked(session) && !this.isExpired(session, now);
  }

  rotate(
    id: number,
    currentRefreshTokenHash: string,
    nextRefreshTokenHash: string,
    now = new Date(),
  ): Promise<boolean> {
    return this.sessions.rotate(
      id,
      currentRefreshTokenHash,
      nextRefreshTokenHash,
      now,
    );
  }

  revoke(
    id: number,
    reason: string | null,
    revokedAt = new Date(),
  ): Promise<boolean> {
    return this.sessions.revoke(id, revokedAt, reason);
  }

  revokeByRefreshTokenHash(
    refreshTokenHash: string,
    reason: string | null,
    revokedAt = new Date(),
  ): Promise<boolean> {
    return this.sessions.revokeByRefreshTokenHash(
      refreshTokenHash,
      revokedAt,
      reason,
    );
  }

  revokeAllForUser(
    userId: number,
    reason: string | null,
    revokedAt = new Date(),
  ): Promise<number> {
    return this.sessions.revokeAllForUser(userId, revokedAt, reason);
  }
}
