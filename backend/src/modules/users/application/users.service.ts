import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import {
  getAccountLockoutPolicy,
  isTemporaryLockActive,
} from '../../../auth/account-lockout.policy';
import { AuditAction } from '../../../audit/audit-actions';
import { AuditContext, AuditService } from '../../../audit/audit.service';
import { User, UserStatus } from '../domain/entities/user';
import type { UsersRepository } from '../domain/repositories/users-repository';
import { QueryUsersDto } from '../presentation/dto/query-users.dto';
import { UpdateUserDto } from '../presentation/dto/update-user.dto';

const ADMIN_ROLE = 'Administrador';

function sanitizeUser(user: User, lockoutMinutes: number) {
  const isTemporarilyLocked = isTemporaryLockActive(
    user.lockedAt,
    lockoutMinutes,
  );
  const isAdministrativelyBlocked = user.status === UserStatus.BLOCKED;
  return {
    ...user,
    isBlocked: isAdministrativelyBlocked || isTemporarilyLocked,
    isTemporarilyLocked,
    isAdministrativelyBlocked,
  };
}

@Injectable()
export class UsersService {
  private readonly lockoutMinutes: number;

  constructor(
    private readonly repository: UsersRepository,
    @Optional() private readonly audit?: AuditService,
  ) {
    this.lockoutMinutes = getAccountLockoutPolicy().lockoutMinutes;
  }

  async findAll(query: QueryUsersDto) {
    const page = await this.repository.findPage({
      name: query.name,
      email: query.email,
      identification: query.identification,
      status: query.status as UserStatus | undefined,
      roleId: query.roleId,
      blocked: query.blocked,
      page: query.page,
      limit: query.limit,
    });
    return {
      data: page.data.map((user) => sanitizeUser(user, this.lockoutMinutes)),
      total: page.total,
      page: page.page,
      limit: page.limit,
    };
  }

  async findOne(id: number) {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return sanitizeUser(user, this.lockoutMinutes);
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    actorId?: number,
    context: AuditContext = {},
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('At least one editable field is required');
    }
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('User not found');
    if (dto.email) {
      const duplicate = await this.repository.findByEmail(dto.email, id);
      if (duplicate) throw new ConflictException('Email is already registered');
    }

    try {
      const user = await this.repository.updateProfile(id, dto);
      await this.audit?.log({
        userId: actorId,
        action: AuditAction.USER_UPDATED,
        module: 'USERS',
        entityType: 'User',
        entityId: id,
        details: { changedFields: Object.keys(dto) },
        ...context,
      });
      return sanitizeUser(user, this.lockoutMinutes);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  async changeRole(
    id: number,
    roleId: number,
    actorId?: number,
    context: AuditContext = {},
  ) {
    let previousRoleId: number | undefined;
    const result = await this.repository.withTransaction(async (tx) => {
      const [user, role] = await Promise.all([
        tx.findById(id),
        tx.findRoleById(roleId),
      ]);
      if (!user) throw new NotFoundException('User not found');
      if (!role) throw new NotFoundException('Role not found');
      if (!role.isActive) throw new ConflictException('Role is inactive');
      previousRoleId = user.roleId;

      if (
        user.status === UserStatus.ACTIVE &&
        user.role.name === ADMIN_ROLE &&
        role.name !== ADMIN_ROLE
      ) {
        await this.assertAnotherActiveAdministrator(tx, id);
      }

      return tx.updateRole(id, roleId);
    });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.USER_ROLE_CHANGED,
      module: 'USERS',
      entityType: 'User',
      entityId: id,
      details: { previousRoleId, newRoleId: roleId },
      ...context,
    });
    return sanitizeUser(result, this.lockoutMinutes);
  }

  async activate(id: number, actorId?: number, context: AuditContext = {}) {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    const passwordHash = await this.repository.getPasswordHash(id);
    if (!passwordHash) {
      throw new ConflictException('Account activation has not been completed');
    }
    if (user.status === UserStatus.BLOCKED) {
      throw new ConflictException('User is administratively blocked');
    }
    if (user.status === UserStatus.ACTIVE) {
      throw new ConflictException('User is already active');
    }
    const updated = await this.repository.updateStatus(id, UserStatus.ACTIVE);
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.USER_ACTIVATED,
      module: 'USERS',
      entityType: 'User',
      entityId: id,
      ...context,
    });
    return sanitizeUser(updated, this.lockoutMinutes);
  }

  async deactivate(id: number, actorId?: number, context: AuditContext = {}) {
    const result = await this.repository.withTransaction(async (tx) => {
      const user = await tx.findById(id);
      if (!user) throw new NotFoundException('User not found');
      if (user.status === UserStatus.INACTIVE) {
        throw new ConflictException('User is already inactive');
      }
      if (user.status === UserStatus.ACTIVE && user.role.name === ADMIN_ROLE) {
        await this.assertAnotherActiveAdministrator(tx, id);
      }
      return tx.updateStatus(id, UserStatus.INACTIVE);
    });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.USER_DEACTIVATED,
      module: 'USERS',
      entityType: 'User',
      entityId: id,
      ...context,
    });
    return sanitizeUser(result, this.lockoutMinutes);
  }

  async unlock(id: number, actorId?: number, context: AuditContext = {}) {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (user.status === UserStatus.BLOCKED) {
      throw new ConflictException('User is administratively blocked');
    }
    if (!isTemporaryLockActive(user.lockedAt, this.lockoutMinutes)) {
      throw new ConflictException('User is not temporarily locked');
    }

    const updated = await this.repository.resetTemporaryLock(id);
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.ACCOUNT_UNLOCKED,
      module: 'USERS',
      entityType: 'User',
      entityId: id,
      ...context,
    });
    return sanitizeUser(updated, this.lockoutMinutes);
  }

  private async assertAnotherActiveAdministrator(
    tx: UsersRepository,
    excludedUserId: number,
  ) {
    const count = await tx.countActiveAdministrators(excludedUserId);
    if (count === 0) {
      throw new ConflictException(
        'The last active administrator cannot be deactivated or demoted',
      );
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
