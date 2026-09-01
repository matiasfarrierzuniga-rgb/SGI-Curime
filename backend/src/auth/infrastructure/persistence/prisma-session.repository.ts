import { Injectable } from '@nestjs/common';
import type { Session as PrismaSession } from '../../../../generated/prisma/client';
import type {
  CreateSessionInput,
  SessionRepository,
} from '../../application/ports/session-repository.port';
import type { Session } from '../../domain/entities/session';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly db: PrismaService) {}

  async create(input: CreateSessionInput): Promise<Session> {
    return toSession(await this.db.session.create({ data: input }));
  }

  async findById(id: number): Promise<Session | null> {
    const session = await this.db.session.findUnique({ where: { id } });
    return session ? toSession(session) : null;
  }

  async findActiveById(id: number, now: Date): Promise<Session | null> {
    const session = await this.db.session.findFirst({
      where: { id, revokedAt: null, expiresAt: { gt: now } },
    });
    return session ? toSession(session) : null;
  }

  async revoke(
    id: number,
    revokedAt: Date,
    reason: string | null,
  ): Promise<boolean> {
    const result = await this.db.session.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt, revocationReason: reason },
    });
    return result.count === 1;
  }

  async revokeAllForUser(
    userId: number,
    revokedAt: Date,
    reason: string | null,
  ): Promise<number> {
    const result = await this.db.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt, revocationReason: reason },
    });
    return result.count;
  }
}

function toSession(session: PrismaSession): Session {
  return {
    id: session.id,
    userId: session.userId,
    refreshTokenHash: session.refreshTokenHash,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt,
    revocationReason: session.revocationReason,
  };
}
