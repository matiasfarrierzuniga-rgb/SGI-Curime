import { User, UserStatus } from '../entities/user';
import { LastAdministratorError } from '../errors/last-administrator.error';
import { SYSTEM_ADMIN_ROLE } from '../../../../auth/domain/policies/canonical-role-catalog';

export function requiresAdminContinuity(
  user: Pick<User, 'status' | 'role'>,
  targetRoleName?: string,
): boolean {
  return (
    user.status === UserStatus.ACTIVE &&
    user.role.name === SYSTEM_ADMIN_ROLE &&
    (targetRoleName === undefined || targetRoleName !== SYSTEM_ADMIN_ROLE)
  );
}

export function assertAnotherActiveAdministrator(count: number): void {
  if (count === 0) {
    throw new LastAdministratorError();
  }
}
