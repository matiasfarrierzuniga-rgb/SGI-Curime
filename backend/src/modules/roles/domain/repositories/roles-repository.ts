import type { Role } from '../entities/role';

export interface RolesRepository {
  findActive(): Promise<Role[]>;
}