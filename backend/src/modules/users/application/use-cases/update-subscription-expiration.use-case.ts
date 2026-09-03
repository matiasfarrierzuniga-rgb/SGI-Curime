import { Inject, Injectable, Optional } from '@nestjs/common';
import { AuditAction } from '../../../../audit/audit-actions';
import { User } from '../../domain/entities/user';
import { SubscriptionExpirationUnavailableError } from '../../domain/errors/subscription-expiration-unavailable.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../domain/repositories/users-repository';
import {
  AUDIT_PORT,
  type AuditContext,
  type AuditPort,
} from '../ports/audit.port';

const SUBSCRIPTION_L1_ROLE = 'Subscription_L1';

@Injectable()
export class UpdateSubscriptionExpirationUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repository: UsersRepository,
    @Optional() @Inject(AUDIT_PORT) private readonly audit?: AuditPort,
  ) {}

  async execute(
    id: number,
    subscriptionExpirationDate: Date,
    actorId?: number,
    context: AuditContext = {},
  ): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) throw new UserNotFoundError();
    if (user.role.name !== SUBSCRIPTION_L1_ROLE) {
      throw new SubscriptionExpirationUnavailableError();
    }
    const updated = await this.repository.updateSubscriptionExpirationDate(
      id,
      subscriptionExpirationDate,
    );
    await this.audit?.record({
      userId: actorId,
      action: AuditAction.USER_UPDATED,
      module: 'USERS',
      entityType: 'User',
      entityId: id,
      details: { changedFields: ['subscriptionExpirationDate'] },
      ...context,
    });
    return updated;
  }
}
