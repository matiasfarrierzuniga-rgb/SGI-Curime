import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../domain/repositories/users-repository';
import { canAccessErp } from '../../../../auth/domain/policies/internal-access.policy';

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repository: UsersRepository,
  ) {}

  async execute(id: number): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) throw new UserNotFoundError();
    return user;
  }

  async executeWithAffiliation(id: number) {
    const user = await this.execute(id);
    const affiliation = await this.repository.findAffiliationContext(id);
    return {
      user,
      affiliation: {
        affiliateId: affiliation.affiliateId,
        affiliateStatus: affiliation.affiliateStatus,
        affiliateRoleId: affiliation.affiliateRoleId,
        affiliateRequestStatus: affiliation.affiliateRequestStatus,
        canAccessErp: canAccessErp({
          userStatus: user.status,
          userRoleId: user.roleId,
          userRoleName: user.role.name,
          userRoleIsActive: user.role.isActive,
          hasPerson: affiliation.hasPerson,
          affiliateStatus: affiliation.affiliateStatus,
          affiliateRoleId: affiliation.affiliateRoleId,
        }),
      },
    };
  }
}
