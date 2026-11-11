import { Inject, Injectable, Optional } from '@nestjs/common';
import { AuditAction } from '../../../audit/audit-actions';
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

@Injectable()
export class LogoutAllUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repository: AuthRepository,
    @Optional() @Inject(AUDIT_PORT) private readonly audit?: AuditPort,
  ) {}

  async execute(
    userId: number,
    context: AuditContext = {},
  ): Promise<{ message: string }> {
    const revokedSessions = await this.repository.withTransaction((tx) =>
      tx.invalidateUserSessions(userId, 'logout-all'),
    );
    await recordAuditBestEffort(this.audit, {
      userId,
      action: AuditAction.SESSION_REVOKED,
      module: 'AUTH',
      entityType: 'User',
      entityId: userId,
      ...context,
    });
    return { message: 'Logged out from all sessions' };
  }
}
