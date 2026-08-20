import { Inject, Injectable, Optional } from '@nestjs/common';
import { AuditAction } from '../../../../audit/audit-actions';
import { User, UserStatus } from '../../domain/entities/user';
import { AccountAlreadyInactiveError } from '../../domain/errors/account-already-inactive.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import {
  assertAnotherActiveAdministrator,
  requiresAdminContinuity,
} from '../../domain/policies/administrator-continuity.policy';
import type { UsersRepository } from '../../domain/repositories/users-repository';
import {
  AUDIT_PORT,
  type AuditContext,
  type AuditPort,
} from '../ports/audit.port';

@Injectable()
export class DeactivateUserUseCase {
  constructor(
    private readonly repository: UsersRepository,
    @Optional() @Inject(AUDIT_PORT) private readonly audit?: AuditPort,
  ) {}

  async execute(
    id: number,
    actorId?: number,
    context: AuditContext = {},
  ): Promise<User> {
    const result = await this.repository.withTransaction(async (tx) => {
      const user = await tx.findById(id);
      if (!user) throw new UserNotFoundError();
      if (user.status === UserStatus.INACTIVE) {
        throw new AccountAlreadyInactiveError();
      }
      if (requiresAdminContinuity(user)) {
        const count = await tx.countActiveAdministrators(id);
        assertAnotherActiveAdministrator(count);
      }
      return tx.updateStatus(id, UserStatus.INACTIVE);
    });
    await this.audit?.record({
      userId: actorId,
      action: AuditAction.USER_DEACTIVATED,
      module: 'USERS',
      entityType: 'User',
      entityId: id,
      ...context,
    });
    return result;
  }
}
