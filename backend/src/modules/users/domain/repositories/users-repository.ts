import { User, UserRole, UserStatus } from '../entities/user';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface UserQuery {
  name?: string;
  email?: string;
  identification?: string;
  status?: UserStatus;
  roleId?: number;
  blocked?: boolean;
  page: number;
  limit: number;
}

export interface UserPage {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UserUpdateData {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UsersRepository {
  withTransaction<T>(work: (repo: UsersRepository) => Promise<T>): Promise<T>;
  findPage(query: UserQuery): Promise<UserPage>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string, excludeId?: number): Promise<{ id: number } | null>;
  findRoleById(id: number): Promise<UserRole | null>;
  getPasswordHash(id: number): Promise<string | null>;
  updateProfile(id: number, data: UserUpdateData): Promise<User>;
  updateStatus(id: number, status: UserStatus): Promise<User>;
  updateRole(id: number, roleId: number): Promise<User>;
  resetTemporaryLock(id: number): Promise<User>;
  countActiveAdministrators(excludeUserId: number): Promise<number>;
}
