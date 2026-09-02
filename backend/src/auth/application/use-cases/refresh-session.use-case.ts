import { Inject, Injectable, Optional } from '@nestjs/common';
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
import { TOKEN_SERVICE, type TokenService } from '../ports/token-service.port';
import { SessionService } from '../services/session.service';
import {
  REFRESH_TOKEN_SERVICE,
  type RefreshTokenPort,
} from '../ports/refresh-token.port';

export interface RefreshSessionResult {
  accessToken: string;
  refreshToken: string;
  sessionExpiresAt: Date;
}

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    private readonly sessions: SessionService,
    @Inject(REFRESH_TOKEN_SERVICE)
    private readonly refreshTokens: RefreshTokenPort,
    @Inject(AUTH_REPOSITORY) private readonly users: AuthRepository,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Optional() @Inject(AUDIT_PORT) private readonly audit?: AuditPort,
  ) {}

  async execute(
    rawRefreshToken: string | undefined,
    context: AuditContext = {},
  ): Promise<RefreshSessionResult> {
    const now = new Date();
    const currentHash = rawRefreshToken
      ? this.refreshTokens.hash(rawRefreshToken)
      : undefined;
    const session = currentHash
      ? await this.sessions.findByRefreshTokenHash(currentHash)
      : null;

    if (!currentHash || !session || !this.sessions.isActive(session, now)) {
      await this.auditFailure(context);
      throw invalidRefresh();
    }

    const user = await this.users.findCredentialsById(session.userId);
    if (!user || user.status !== 'ACTIVE') {
      await this.auditFailure(context, session.userId);
      throw invalidRefresh();
    }

    const nextRefreshToken = this.refreshTokens.generate();
    const rotated = await this.sessions.rotate(
      session.id,
      currentHash,
      this.refreshTokens.hash(nextRefreshToken),
      now,
    );
    if (!rotated) {
      await this.auditFailure(context, session.userId);
      throw invalidRefresh();
    }

    const accessToken = await this.tokens.sign({
      sub: user.id,
      email: user.email,
      role: user.roleName,
    });
    await recordAuditBestEffort(this.audit, {
      userId: user.id,
      action: AuditAction.REFRESH_SUCCESS,
      module: 'AUTH',
      entityType: 'User',
      entityId: user.id,
      ...context,
    });
    return {
      accessToken,
      refreshToken: nextRefreshToken,
      sessionExpiresAt: session.expiresAt,
    };
  }

  private async auditFailure(
    context: AuditContext,
    userId?: number,
  ): Promise<void> {
    await recordAuditBestEffort(this.audit, {
      userId,
      action: AuditAction.REFRESH_FAILED,
      module: 'AUTH',
      ...context,
    });
  }
}

function invalidRefresh(): AuthApplicationError {
  return new AuthApplicationError('UNAUTHORIZED', 'Unauthorized');
}
