import {
  getAccountLockoutPolicy,
  isTemporaryLockActive,
} from '../../../../auth/account-lockout.policy';
import { User, UserStatus } from '../../domain/entities/user';

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
