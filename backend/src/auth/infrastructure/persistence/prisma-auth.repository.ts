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
  include: {
    role: { include: { permissions: { include: { permission: true } } } };
    person: { include: { affiliate: true } };
  };
}>;

type ActivationTokenRow = Prisma.AccountActivationTokenGetPayload<{
  include: { user: { include: { role: true } } };
}>;

type ResetTokenRow = Prisma.PasswordResetTokenGetPayload<{
  include: { user: true };
}>;

function toAuthAccount(user: AccountRow): AuthAccount {
  return {
    id: user.id,
    email: user.email,
    fullName:
      canonicalPersonName(user.person) ??
      user.fullName ??
       'Cuenta',
    status: user.status,
    passwordHash: user.passwordHash,
    lockedAt: user.lockedAt,
    failedLoginAttempts: user.failedLoginAttempts,
    lastLoginAt: user.lastLoginAt,
    sessionsInvalidBefore: user.sessionsInvalidBefore,
    sessionGeneration: user.sessionGeneration,
    roleName: user.role.name,
    roleId: user.roleId,
    roleIsActive: user.role.isActive,
    permissionCodes: user.role.permissions
      .map((rolePermission) => rolePermission.permission?.code)
      .filter((code): code is string => typeof code === 'string'),
    hasPerson: user.person !== null,
    affiliateStatus: user.person?.affiliate?.status ?? null,
    affiliateRoleId: user.person?.affiliate?.legacyRoleId ?? null,
    subscriptionExpirationDate: user.subscriptionExpirationDate,
  };
}

function canonicalPersonName(person: AccountRow['person']): string | null {
  if (!person) return null;
  return (
    [person.firstName, person.firstSurname, person.secondSurname]
      .filter((part): part is string => Boolean(part?.trim()))
      .join(' ') ||
    person.legacyFullName ||
    null
  );
}

@Injectable()
export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly db: PrismaService) {}

  async findCredentialsByEmail(email: string): Promise<AuthAccount | null> {
    const user = await this.db.user.findUnique({
      where: { email },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        person: { include: { affiliate: true } },
      },
    });
    return user ? toAuthAccount(user) : null;
  }

  async findCredentialsById(id: number): Promise<AuthAccount | null> {
    const user = await this.db.user.findUnique({
      where: { id },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        person: { include: { affiliate: true } },
      },
    });
    return user ? toAuthAccount(user) : null;
  }

  async findActivationToken(
    tokenHash: string,
  ): Promise<ActivationToken | null> {
    const token = await this.db.accountActivationToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { role: true } } },
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
  ): Promise<{ sessionId: number; sessionGeneration: number }> {
    return this.db.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const locked = await tx.user.updateMany({
          where: { id, status: 'ACTIVE' },
          data: {
            failedLoginAttempts: 0,
            lockedAt: null,
            lastLoginAt: new Date(),
          },
        });
        if (locked.count !== 1) throw new Error('Account is no longer active.');
        const current = await tx.user.findUniqueOrThrow({
          where: { id },
          select: { sessionGeneration: true },
        });
        const session = await tx.session.create({
          data: { userId: id, refreshTokenHash, expiresAt },
        });
        return {
          sessionId: session.id,
          sessionGeneration: current.sessionGeneration,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async invalidateAndCreateResetToken(
    userId: number,
    tokenHash: string,
    expiresAt: Date,
    expectedEmail: string,
  ): Promise<boolean> {
    try {
      return await this.db.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const locked = await tx.user.updateMany({
            where: { id: userId, status: 'ACTIVE', email: expectedEmail },
            data: { updatedAt: new Date() },
          });
          if (locked.count !== 1) return false;
          const now = new Date();
          await tx.passwordResetToken.updateMany({
            where: { userId, usedAt: null, expiresAt: { gt: now } },
            data: { usedAt: now },
          });
          await tx.passwordResetToken.create({
            data: { userId, tokenHash, expiresAt },
          });
          return true;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      )
        return false;
      throw error;
    }
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
    purpose: token.purpose,
    userRoleName: token.user.role.name,
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
    async claimActivationToken(
      tokenId: number,
      now: Date,
      purpose: 'LEGACY_ACCOUNT_ACTIVATION',
    ): Promise<boolean> {
      const claimed = await tx.accountActivationToken.updateMany({
        where: { id: tokenId, purpose, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      return claimed.count === 1;
    },
    async activateUser(userId: number, passwordHash: string): Promise<boolean> {
      const activated = await tx.user.updateMany({
        where: {
          id: userId,
          status: 'INACTIVE',
          role: {
            name: { not: 'ROLE_COMMUNITY_USER' },
          },
        },
        data: { passwordHash, status: 'ACTIVE' },
      });
      return activated.count === 1;
    },
    async claimResetToken(tokenId: number, now: Date): Promise<boolean> {
      const claimed = await tx.passwordResetToken.updateMany({
        where: {
          id: tokenId,
          usedAt: null,
          expiresAt: { gt: now },
          user: { status: 'ACTIVE' },
        },
        data: { usedAt: now },
      });
      return claimed.count === 1;
    },
    async setUserPassword(
      userId: number,
      passwordHash: string,
    ): Promise<boolean> {
      const changed = await tx.user.updateMany({
        where: { id: userId, status: 'ACTIVE' },
        data: { passwordHash, failedLoginAttempts: 0, lockedAt: null },
      });
      return changed.count === 1;
    },
    async revokeUserSessions(userId: number, reason: string): Promise<number> {
      const revoked = await tx.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date(), revocationReason: reason },
      });
      return revoked.count;
    },
    async invalidateUserSessions(
      userId: number,
      reason: string,
    ): Promise<number> {
      const updated = await tx.user.updateMany({
        where: { id: userId, status: 'ACTIVE' },
        data: { sessionGeneration: { increment: 1 } },
      });
      if (updated.count !== 1) {
        throw new Error('Account is no longer active.');
      }
      const revoked = await tx.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date(), revocationReason: reason },
      });
      return revoked.count;
    },
  };
}
