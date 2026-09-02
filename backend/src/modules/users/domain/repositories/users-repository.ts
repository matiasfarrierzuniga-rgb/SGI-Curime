import { User, UserRole, UserStatus } from '../entities/user';
import { RegistrationConflictError } from '../errors/registration-conflict.error';
import type {
  RuntimePersonIdentityInput,
  RuntimePersonResolutionResult,
} from '../../../../identity/runtime-person-resolution';

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
  phoneCountryCode?: string;
  phoneNationalNumber?: string;
  address?: string;
}

export interface UserCreateData {
  fullName: string;
  identification: string;
  identificationType: 'NATIONAL' | 'DIMEX';
  email: string;
  phoneCountryCode?: string;
  phoneNationalNumber?: string;
  address?: string;
  passwordHash: string;
  status: UserStatus;
  roleId: number;
  personId: number;
}

export type RegistrationConflictCode =
  | 'DUPLICATE_EMAIL'
  | 'PERSON_ALREADY_HAS_USER'
  | 'IDENTITY_CONFLICT'
  | 'MANUAL_REVIEW_REQUIRED'
  | 'IDENTITY_DUPLICATE_CORRUPTION'
  | 'INVALID_IDENTIFICATION'
  | 'INVALID_STRUCTURED_NAME'
  | 'IDENTITY_INCOMPLETE'
  | 'PERSON_LOGICAL_IDENTITY_RACE'
  | 'USER_EMAIL_RACE'
  | 'USER_PERSON_RACE'
  | 'LEGACY_USER_IDENTIFICATION_CONFLICT'
  | 'UNEXPECTED_USER_UNIQUE_CONFLICT';

export class RegistrationDataConflictError extends RegistrationConflictError {
  constructor(public readonly code: RegistrationConflictCode) {
    super();
    this.name = 'RegistrationDataConflictError';
  }
}

export interface UsersRepository {
  withTransaction<T>(work: (repo: UsersRepository) => Promise<T>): Promise<T>;
  withRegistrationTransaction<T>(
    work: (repo: UsersRepository) => Promise<T>,
  ): Promise<T>;
  findPage(query: UserQuery): Promise<UserPage>;
  findById(id: number): Promise<User | null>;
  findByEmail(
    email: string,
    excludeId?: number,
  ): Promise<{ id: number } | null>;
  findByPersonId(personId: number): Promise<{ id: number } | null>;
  findRoleById(id: number): Promise<UserRole | null>;
  findRoleByName(name: string): Promise<UserRole | null>;
  create(data: UserCreateData): Promise<User>;
  resolvePerson(
    input: RuntimePersonIdentityInput,
  ): Promise<RuntimePersonResolutionResult>;
  getPasswordHash(id: number): Promise<string | null>;
  updateProfile(id: number, data: UserUpdateData): Promise<User>;
  updateStatus(id: number, status: UserStatus): Promise<User>;
  updateRole(id: number, roleId: number): Promise<User>;
  resetTemporaryLock(id: number): Promise<User>;
  countActiveAdministrators(excludeUserId: number): Promise<number>;
}
