import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  getAccountLockoutPolicy,
  isTemporaryLockActive,
} from '../../../../auth/account-lockout.policy';
import { AuditAction } from '../../../../audit/audit-actions';
import { User, UserStatus } from '../../domain/entities/user';
import { AccountBlockedError } from '../../domain/errors/account-blocked.error';
import { AccountNotLockedError } from '../../domain/errors/account-not-locked.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import type { UsersRepository } from '../../domain/repositories/users-repository';
import {
  AUDIT_PORT,
  type AuditContext,
  type AuditPort,
} from '../ports/audit.port';

@Injectable()
export class UnlockUserUseCase {
  private readonly lockoutMinutes: number;

  constructor(
    private readonly repository: UsersRepository,
    @Optional() @Inject(AUDIT_PORT) private readonly audit?: AuditPort,
  ) {
    this.lockoutMinutes = getAccountLockoutPolicy().lockoutMinutes;
  }

  async execute(
    id: number,
    actorId?: number,
    context: AuditContext = {},
  ): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) throw new UserNotFoundError();
    if (user.status === UserStatus.BLOCKED) throw new AccountBlockedError();
    if (!isTemporaryLockActive(user.lockedAt, this.lockoutMinutes)) {
      throw new AccountNotLockedError();
    }

    const updated = await this.repository.resetTemporaryLock(id);
    await this.audit?.record({
      userId: actorId,
      action: AuditAction.ACCOUNT_UNLOCKED,
      module: 'USERS',
      entityType: 'User',
      entityId: id,
      ...context,
    });
    return updated;
  }
}
