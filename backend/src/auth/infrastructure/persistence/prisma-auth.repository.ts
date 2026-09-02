import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ActivationToken,
  AuthAccount,
  ResetToken,
} from '../../domain/entities/auth-account';
import type {
  AuthRepository,
  AuthTransaction,
} from '../../application/ports/auth-repository.port';

type AccountRow = Prisma.UserGetPayload<{
  include: { role: true };
}>;

type ActivationTokenRow = Prisma.AccountActivationTokenGetPayload<{
  include: { user: true };
}>;

type ResetTokenRow = Prisma.PasswordResetTokenGetPayload<{
  include: { user: true };
}>;

function toAuthAccount(user: AccountRow): AuthAccount {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    status: user.status,
    passwordHash: user.passwordHash,
    lockedAt: user.lockedAt,
    failedLoginAttempts: user.failedLoginAttempts,
    lastLoginAt: user.lastLoginAt,
    roleName: user.role.name,
  };
}

@Injectable()
export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly db: PrismaService) {}

  async findCredentialsByEmail(email: string): Promise<AuthAccount | null> {
    const user = await this.db.user.findUnique({
      where: { email },
      include: { role: true },
    });
    return user ? toAuthAccount(user) : null;
  }

  async findCredentialsById(id: number): Promise<AuthAccount | null> {
    const user = await this.db.user.findUnique({
      where: { id },
      include: { role: true },
    });
    return user ? toAuthAccount(user) : null;
  }

  async findActivationToken(
    tokenHash: string,
  ): Promise<ActivationToken | null> {
    const token = await this.db.accountActivationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    return token ? toActivationToken(token) : null;
  }

  async findResetToken(tokenHash: string): Promise<ResetToken | null> {
    const token = await this.db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    return token ? toResetToken(token) : null;
  }

  async recordFailedLogin(id: number, maxAttempts: number): Promise<boolean> {
    return this.db.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.user.update({
        where: { id },
        data: { failedLoginAttempts: { increment: 1 } },
        select: { failedLoginAttempts: true },
      });

      if (updated.failedLoginAttempts >= maxAttempts) {
        await tx.user.update({
          where: { id },
          data: { lockedAt: new Date() },
        });
        return true;
      }
      return false;
    });
  }

  async clearLockout(id: number): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: { failedLoginAttempts: 0, lockedAt: null },
    });
  }

  async recordLoginSuccess(id: number): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockedAt: null,
        lastLoginAt: new Date(),
      },
    });
  }

  async recordLoginSuccessAndCreateSession(
    id: number,
    refreshTokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.db.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.session.create({
        data: { userId: id, refreshTokenHash, expiresAt },
      });
      await tx.user.update({
        where: { id },
        data: {
          failedLoginAttempts: 0,
          lockedAt: null,
          lastLoginAt: new Date(),
        },
      });
    });
  }

  async invalidateAndCreateResetToken(
    userId: number,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.db.$transaction(async (tx: Prisma.TransactionClient) => {
      const now = new Date();
      await tx.passwordResetToken.updateMany({
        where: { userId, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      await tx.passwordResetToken.create({
        data: { userId, tokenHash, expiresAt },
      });
    });
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: { passwordHash, failedLoginAttempts: 0, lockedAt: null },
    });
  }

  async withTransaction<T>(
    work: (tx: AuthTransaction) => Promise<T>,
  ): Promise<T> {
    return this.db.$transaction(
      async (tx: Prisma.TransactionClient) => work(toAuthTransaction(tx)),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}

function toActivationToken(token: ActivationTokenRow): ActivationToken {
  return {
    id: token.id,
    userId: token.userId,
    usedAt: token.usedAt,
    expiresAt: token.expiresAt,
    userStatus: token.user.status,
  };
}

function toResetToken(token: ResetTokenRow): ResetToken {
  return {
    id: token.id,
    userId: token.userId,
    usedAt: token.usedAt,
    expiresAt: token.expiresAt,
  };
}

function toAuthTransaction(tx: Prisma.TransactionClient): AuthTransaction {
  return {
    async claimActivationToken(tokenId: number, now: Date): Promise<boolean> {
      const claimed = await tx.accountActivationToken.updateMany({
        where: { id: tokenId, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      return claimed.count === 1;
    },
    async activateUser(userId: number, passwordHash: string): Promise<boolean> {
      const activated = await tx.user.updateMany({
        where: { id: userId, status: 'INACTIVE' },
        data: { passwordHash, status: 'ACTIVE' },
      });
      return activated.count === 1;
    },
    async claimResetToken(tokenId: number, now: Date): Promise<boolean> {
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: tokenId, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      return claimed.count === 1;
    },
    async setUserPassword(userId: number, passwordHash: string): Promise<void> {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash, failedLoginAttempts: 0, lockedAt: null },
      });
    },
    async revokeUserSessions(userId: number, reason: string): Promise<number> {
      const revoked = await tx.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date(), revocationReason: reason },
      });
      return revoked.count;
    },
  };
}
