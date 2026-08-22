import type { Role } from '../entities/role';

export const ROLES_REPOSITORY = Symbol('ROLES_REPOSITORY');

export interface RolesRepository {
  findActive(): Promise<Role[]>;
}
