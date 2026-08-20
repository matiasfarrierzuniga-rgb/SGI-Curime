import { User, UserStatus } from '../entities/user';
import { LastAdministratorError } from '../errors/last-administrator.error';

const ADMIN_ROLE = 'Administrador';

export function requiresAdminContinuity(
  user: Pick<User, 'status' | 'role'>,
  targetRoleName?: string,
): boolean {
  return (
    user.status === UserStatus.ACTIVE &&
    user.role.name === ADMIN_ROLE &&
    (targetRoleName === undefined || targetRoleName !== ADMIN_ROLE)
  );
}

export function assertAnotherActiveAdministrator(count: number): void {
  if (count === 0) {
    throw new LastAdministratorError();
  }
}
