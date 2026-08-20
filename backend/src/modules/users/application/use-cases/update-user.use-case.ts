import { Injectable, Optional } from '@nestjs/common';
import { AuditAction } from '../../../../audit/audit-actions';
import { User } from '../../domain/entities/user';
import { EmailAlreadyRegisteredError } from '../../domain/errors/email-already-registered.error';
import { EmptyUpdateError } from '../../domain/errors/empty-update.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import type {
  UserUpdateData,
  UsersRepository,
} from '../../domain/repositories/users-repository';
import type { AuditContext, AuditPort } from '../ports/audit.port';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly repository: UsersRepository,
    @Optional() private readonly audit?: AuditPort,
  ) {}

  async execute(
    id: number,
    data: UserUpdateData,
    actorId?: number,
    context: AuditContext = {},
  ): Promise<User> {
    if (Object.keys(data).length === 0) {
      throw new EmptyUpdateError();
    }
    const existing = await this.repository.findById(id);
    if (!existing) throw new UserNotFoundError();
    if (data.email) {
      const duplicate = await this.repository.findByEmail(data.email, id);
      if (duplicate) throw new EmailAlreadyRegisteredError();
    }

    const user = await this.repository.updateProfile(id, data);
    await this.audit?.record({
      userId: actorId,
      action: AuditAction.USER_UPDATED,
      module: 'USERS',
      entityType: 'User',
      entityId: id,
      details: { changedFields: Object.keys(data) },
      ...context,
    });
    return user;
  }
}
