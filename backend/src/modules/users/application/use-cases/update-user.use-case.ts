import { Inject, Injectable, Optional } from '@nestjs/common';
import { isValidPhone } from '../../../../common/validation/identity-contact.validation';
import { AuditAction } from '../../../../audit/audit-actions';
import { User } from '../../domain/entities/user';
import { EmailAlreadyRegisteredError } from '../../domain/errors/email-already-registered.error';
import { EmptyUpdateError } from '../../domain/errors/empty-update.error';
import { InvalidPhoneError } from '../../domain/errors/invalid-phone.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import {
  USERS_REPOSITORY,
  type UserUpdateData,
  type UsersRepository,
} from '../../domain/repositories/users-repository';
import {
  AUDIT_PORT,
  type AuditContext,
  type AuditPort,
} from '../ports/audit.port';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repository: UsersRepository,
    @Optional() @Inject(AUDIT_PORT) private readonly audit?: AuditPort,
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
    if (
      data.phoneCountryCode !== undefined ||
      data.phoneNationalNumber !== undefined
    ) {
      const countryCode =
        data.phoneCountryCode ?? existing.phoneCountryCode ?? undefined;
      const nationalNumber =
        data.phoneNationalNumber ?? existing.phoneNationalNumber ?? undefined;
      if (!isValidPhone(countryCode, nationalNumber)) {
        throw new InvalidPhoneError();
      }
    }
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
