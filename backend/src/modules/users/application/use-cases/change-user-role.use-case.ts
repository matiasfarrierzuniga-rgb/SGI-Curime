import { Inject, Injectable, Optional } from '@nestjs/common';
import { AuditAction } from '../../../../audit/audit-actions';
import { isCommunityAccountRole } from '../../../../auth/domain/policies/internal-access.policy';
import { User, UserStatus } from '../../domain/entities/user';
import { ActivationNotCompletedError } from '../../domain/errors/activation-not-completed.error';
import { InactiveRoleError } from '../../domain/errors/inactive-role.error';
import { RoleNotFoundError } from '../../domain/errors/role-not-found.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { NonAssignableRoleError } from '../../domain/errors/non-assignable-role.error';
import { isCanonicalRoleCode } from '../../../../auth/domain/policies/canonical-role-catalog';
import {
  assertAnotherActiveAdministrator,
  requiresAdminContinuity,
} from '../../domain/policies/administrator-continuity.policy';
import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../domain/repositories/users-repository';
import {
  AUDIT_PORT,
  type AuditContext,
  type AuditPort,
} from '../ports/audit.port';

@Injectable()
export class ChangeUserRoleUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repository: UsersRepository,
    @Optional() @Inject(AUDIT_PORT) private readonly audit?: AuditPort,
  ) {}

  async execute(
    id: number,
    roleId: number,
    actorId?: number,
    context: AuditContext = {},
  ): Promise<User> {
    const { updated, previousRoleId } = await this.repository.withTransaction((tx) =>
      this.applyRoleChange(tx, id, roleId),
    );
    await this.recordAudit(
      this.audit,
      id,
      roleId,
      previousRoleId,
      actorId,
      context,
    );
    return updated;
  }

  async executeInTransaction(
    repository: UsersRepository,
    id: number,
    roleId: number,
    actorId?: number,
    context: AuditContext = {},
    auditPort?: AuditPort,
  ): Promise<User> {
    const { updated, previousRoleId } = await this.applyRoleChange(
      repository,
      id,
      roleId,
    );
    await this.recordAudit(
      auditPort ?? this.audit,
      id,
      roleId,
      previousRoleId,
      actorId,
      context,
    );
    return updated;
  }

  private async applyRoleChange(
    repository: UsersRepository,
    id: number,
    roleId: number,
  ): Promise<{ updated: User; previousRoleId: number }> {
    const [user, role] = await Promise.all([
      repository.findById(id),
      repository.findRoleById(roleId),
    ]);
    if (!user) throw new UserNotFoundError();
    if (user.status === UserStatus.PENDING_EMAIL_VERIFICATION)
      throw new ActivationNotCompletedError();
    if (
      isCommunityAccountRole(user.role.name) &&
      !(await repository.communityVerificationEvidence(id))
    )
      throw new ActivationNotCompletedError();
    if (!role) throw new RoleNotFoundError();
    if (!role.isActive) throw new InactiveRoleError();
    if (!isCanonicalRoleCode(role.name)) throw new NonAssignableRoleError();
    const previousRoleId = user.roleId;

    if (requiresAdminContinuity(user, role.name)) {
      const count = await repository.countActiveAdministrators(id);
      assertAnotherActiveAdministrator(count);
    }

    const updated = await repository.updateRole(id, roleId);
    return { updated, previousRoleId };
  }

  private async recordAudit(
    auditPort: AuditPort | undefined,
    id: number,
    roleId: number,
    previousRoleId: number,
    actorId: number | undefined,
    context: AuditContext,
  ): Promise<void> {
    await auditPort?.record({
      userId: actorId,
      action: AuditAction.USER_ROLE_CHANGED,
      module: 'USERS',
      entityType: 'User',
      entityId: id,
      details: { previousRoleId, newRoleId: roleId },
      ...context,
    });
  }
}
