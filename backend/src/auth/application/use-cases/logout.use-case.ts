import { Inject, Injectable, Optional } from '@nestjs/common';
import { AuditAction } from '../../../audit/audit-actions';
import { AuthApplicationError } from '../errors/auth.errors';
import {
  AUDIT_PORT,
  type AuditContext,
  type AuditPort,
  recordAuditBestEffort,
} from '../ports/audit.port';
import { SessionService } from '../services/session.service';
import {
  REFRESH_TOKEN_SERVICE,
  type RefreshTokenPort,
} from '../ports/refresh-token.port';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly sessions: SessionService,
    @Inject(REFRESH_TOKEN_SERVICE)
    private readonly refreshTokens: RefreshTokenPort,
    @Optional() @Inject(AUDIT_PORT) private readonly audit?: AuditPort,
  ) {}

  async execute(
    rawRefreshToken: string | undefined,
    context: AuditContext = {},
    authenticatedSessionId?: number,
  ): Promise<{ message: string }> {
    const session = rawRefreshToken
      ? await this.sessions.findByRefreshTokenHash(
          this.refreshTokens.hash(rawRefreshToken),
        )
      : null;
    if (
      session &&
      authenticatedSessionId !== undefined &&
      session.id !== authenticatedSessionId
    ) {
      throw new AuthApplicationError('UNAUTHORIZED', 'Unauthorized');
    }
    const sessionId = session?.id ?? authenticatedSessionId;
    if (sessionId === undefined) return { message: 'Logged out' };

    const revoked = await this.sessions.revoke(sessionId, 'logout');
    if (revoked) {
      await recordAuditBestEffort(this.audit, {
        userId: session?.userId,
        action: AuditAction.LOGOUT,
        module: 'AUTH',
        entityType: 'Session',
        entityId: session?.id,
        ...context,
      });
    }
    return { message: 'Logged out' };
  }
}
