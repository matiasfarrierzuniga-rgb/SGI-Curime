import { Inject, Injectable, Optional } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuditAction } from '../../../audit/audit-actions';
import { AuthApplicationError } from '../errors/auth.errors';
import {
  AUDIT_PORT,
  type AuditContext,
  type AuditPort,
  recordAuditBestEffort,
} from '../ports/audit.port';
import {
  AUTH_REPOSITORY,
  type AuthRepository,
} from '../ports/auth-repository.port';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../ports/password-hasher.port';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repository: AuthRepository,
    @Inject(PASSWORD_HASHER)
    private readonly hasher: PasswordHasher,
    @Optional() @Inject(AUDIT_PORT) private readonly audit?: AuditPort,
  ) {}

  async execute(
    token: string,
    password: string,
    passwordConfirmation: string,
    context: AuditContext = {},
  ): Promise<{ message: string }> {
    if (password !== passwordConfirmation) {
      throw new AuthApplicationError(
        'PASSWORDS_DO_NOT_MATCH',
        'Passwords do not match',
      );
    }

    const resetToken = await this.repository.findResetToken(hashToken(token));

    if (!resetToken) {
      throw new AuthApplicationError(
        'INVALID_RESET_TOKEN',
        'Invalid reset token',
      );
    }
    if (resetToken.usedAt) {
      throw new AuthApplicationError(
        'RESET_TOKEN_USED',
        'Reset token has already been used',
      );
    }
    const now = new Date();
    if (resetToken.expiresAt <= now) {
      throw new AuthApplicationError(
        'RESET_TOKEN_EXPIRED',
        'Reset token has expired',
      );
    }

    const passwordHash = await this.hasher.hash(password);

    const revokedSessions = await this.repository.withTransaction(
      async (tx) => {
        const claimed = await tx.claimResetToken(resetToken.id, now);
        if (!claimed) {
          throw new AuthApplicationError(
            'RESET_TOKEN_NO_LONGER_VALID',
            'Reset token is no longer valid',
          );
        }
        await tx.setUserPassword(resetToken.userId, passwordHash);
        return tx.revokeUserSessions(resetToken.userId, 'password-reset');
      },
    );
    if (revokedSessions > 0) {
      await recordAuditBestEffort(this.audit, {
        userId: resetToken.userId,
        action: AuditAction.SESSION_REVOKED,
        module: 'AUTH',
        entityType: 'User',
        entityId: resetToken.userId,
        ...context,
      });
    }

    await recordAuditBestEffort(this.audit, {
      userId: resetToken.userId,
      action: AuditAction.PASSWORD_RESET,
      module: 'AUTH',
      entityType: 'User',
      entityId: resetToken.userId,
      ...context,
    });

    return { message: 'Password reset successfully' };
  }
}
