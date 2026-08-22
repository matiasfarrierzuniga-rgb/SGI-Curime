import { Inject, Injectable, Optional } from '@nestjs/common';
import { AuditAction } from '../../../../audit/audit-actions';
import { User, UserStatus } from '../../domain/entities/user';
import { AccountAlreadyActiveError } from '../../domain/errors/account-already-active.error';
import { AccountBlockedError } from '../../domain/errors/account-blocked.error';
import { ActivationNotCompletedError } from '../../domain/errors/activation-not-completed.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import type { UsersRepository } from '../../domain/repositories/users-repository';
import { USERS_REPOSITORY } from '../../domain/repositories/users-repository';
import {
  AUDIT_PORT,
  type AuditContext,
  type AuditPort,
} from '../ports/audit.port';

@Injectable()
export class ActivateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly repository: UsersRepository,
    @Optional() @Inject(AUDIT_PORT) private readonly audit?: AuditPort,
  ) {}

  async execute(
    id: number,
    actorId?: number,
    context: AuditContext = {},
  ): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) throw new UserNotFoundError();
    const passwordHash = await this.repository.getPasswordHash(id);
    if (!passwordHash) throw new ActivationNotCompletedError();
    if (user.status === UserStatus.BLOCKED) throw new AccountBlockedError();
    if (user.status === UserStatus.ACTIVE)
      throw new AccountAlreadyActiveError();

    const updated = await this.repository.updateStatus(id, UserStatus.ACTIVE);
    await this.audit?.record({
      userId: actorId,
      action: AuditAction.USER_ACTIVATED,
      module: 'USERS',
      entityType: 'User',
      entityId: id,
      ...context,
    });
    return updated;
  }
}
