import {
  getAccountLockoutPolicy,
  isTemporaryLockActive,
} from '../../../../auth';
import {
  AdminPersonReadModel,
  User,
  UserStatus,
} from '../../domain/entities/user';

const lockoutMinutes = getAccountLockoutPolicy().lockoutMinutes;

export function toUserResponse(user: User) {
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

/**
 * User-admin read model. Root is Person. `id` is Person id; access ids remain
 * User ids for direct account mutations.
 */
export function toAdminUserResponse(person: AdminPersonReadModel) {
  const access = person.access ? toUserResponse(person.access) : null;
  return {
    id: person.id,
    fullName: person.fullName,
    identification: person.identification,
    identificationType: person.identificationType,
    phoneCountryCode: person.phoneCountryCode,
    phoneNationalNumber: person.phoneNationalNumber,
    address: person.address,
    personId: person.id,
    affiliateId: person.affiliate?.id ?? null,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
    person: {
      id: person.id,
      contactEmail: person.contactEmail,
    },
    access: access && {
      id: access.id,
      email: access.email,
      status: access.status,
      subscriptionExpirationDate: access.subscriptionExpirationDate,
      lockedAt: access.lockedAt,
      roleId: access.roleId,
      role: access.role,
      isBlocked: access.isBlocked,
      isTemporarilyLocked: access.isTemporarilyLocked,
      isAdministrativelyBlocked: access.isAdministrativelyBlocked,
    },
    affiliate: person.affiliate,
  };
}
