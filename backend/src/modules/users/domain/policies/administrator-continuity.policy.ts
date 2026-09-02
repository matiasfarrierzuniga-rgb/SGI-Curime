import { User, UserStatus } from '../entities/user';
import { LastAdministratorError } from '../errors/last-administrator.error';
import { ROLE_NAMES } from '../../../../common/security/roles';

export function requiresAdminContinuity(
  user: Pick<User, 'status' | 'role'>,
  targetRoleName?: string,
): boolean {
  return (
    user.status === UserStatus.ACTIVE &&
    user.role.name === ROLE_NAMES.ADMIN &&
    (targetRoleName === undefined || targetRoleName !== ROLE_NAMES.ADMIN)
  );
}

export function assertAnotherActiveAdministrator(count: number): void {
  if (count === 0) {
    throw new LastAdministratorError();
  }
}
