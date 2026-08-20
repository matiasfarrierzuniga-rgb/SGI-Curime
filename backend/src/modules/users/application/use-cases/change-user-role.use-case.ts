import { Inject, Injectable, Optional } from '@nestjs/common';
import { AuditAction } from '../../../../audit/audit-actions';
import { User } from '../../domain/entities/user';
import { InactiveRoleError } from '../../domain/errors/inactive-role.error';
import { RoleNotFoundError } from '../../domain/errors/role-not-found.error';
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
export class ChangeUserRoleUseCase {
  constructor(
    private readonly repository: UsersRepository,
    @Optional() @Inject(AUDIT_PORT) private readonly audit?: AuditPort,
  ) {}

  async execute(
    id: number,
    roleId: number,
    actorId?: number,
    context: AuditContext = {},
  ): Promise<User> {
    let previousRoleId: number | undefined;
    const result = await this.repository.withTransaction(async (tx) => {
      const [user, role] = await Promise.all([
        tx.findById(id),
        tx.findRoleById(roleId),
      ]);
      if (!user) throw new UserNotFoundError();
      if (!role) throw new RoleNotFoundError();
      if (!role.isActive) throw new InactiveRoleError();
      previousRoleId = user.roleId;

      if (requiresAdminContinuity(user, role.name)) {
        const count = await tx.countActiveAdministrators(id);
        assertAnotherActiveAdministrator(count);
      }

      return tx.updateRole(id, roleId);
    });
    await this.audit?.record({
      userId: actorId,
      action: AuditAction.USER_ROLE_CHANGED,
      module: 'USERS',
      entityType: 'User',
      entityId: id,
      details: { previousRoleId, newRoleId: roleId },
      ...context,
    });
    return result;
  }
}
