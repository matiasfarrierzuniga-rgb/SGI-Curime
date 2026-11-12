import {
  AdminPersonReadModel,
  User,
  UserRole,
  UserStatus,
} from '../entities/user';
import type { Prisma } from '../../../../../generated/prisma/client';
import { RegistrationConflictError } from '../errors/registration-conflict.error';
import type {
  RuntimePersonIdentityInput,
  RuntimePersonRecord,
  RuntimePersonResolutionResult,
} from '../../../../identity/runtime-person-resolution';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');
export type UsersTransactionClient = Prisma.TransactionClient;

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
  data: AdminPersonReadModel[];
  total: number;
  page: number;
  limit: number;
}

export interface AccountPage {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface PersonLinkCandidate {
  id: number;
  displayName: string;
  identificationHint: string | null;
  affiliateStatus: 'ACTIVE' | 'INACTIVE' | null;
}

export interface UserAffiliationContext {
  affiliateId: number | null;
  affiliateStatus: 'ACTIVE' | 'INACTIVE' | null;
  affiliateRoleId: number | null;
  affiliateRequestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  hasPerson: boolean;
}

export interface UserUpdateData {
  email?: string;
}

export interface AccountPersonLinkData {
  userId: number;
  personId: number;
  actorId: number;
  evidenceReference: string;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PersonCreateData {
  identificationType: 'NATIONAL' | 'DIMEX';
  identification: string;
  firstName: string;
  firstSurname: string;
  secondSurname?: string;
  phoneCountryCode?: string;
  phoneNationalNumber?: string;
  address?: string;
  actorId: number;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PersonCreateResult {
  personId: number;
  created: boolean;
  person: RuntimePersonRecord;
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
  subscriptionExpirationDate: Date | null;
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
  withTransaction<T>(
    work: (repo: UsersRepository, client: UsersTransactionClient) => Promise<T>,
  ): Promise<T>;
  withRegistrationTransaction<T>(
    work: (repo: UsersRepository, client: UsersTransactionClient) => Promise<T>,
  ): Promise<T>;
  findPage(query: UserQuery): Promise<UserPage>;
  findAccountsPage(query: UserQuery): Promise<AccountPage>;
  findById(id: number): Promise<User | null>;
  findAdminPersonById(id: number): Promise<AdminPersonReadModel | null>;
  findAffiliationContext(id: number): Promise<UserAffiliationContext>;
  findByEmail(
    email: string,
    excludeId?: number,
  ): Promise<{ id: number } | null>;
  findByPersonId(personId: number): Promise<{ id: number } | null>;
  findLinkablePersonCandidates(query: string): Promise<PersonLinkCandidate[]>;
  findRoleById(id: number): Promise<UserRole | null>;
  findRoleByName(name: string): Promise<UserRole | null>;
  create(data: UserCreateData): Promise<User>;
  createPerson(data: PersonCreateData): Promise<PersonCreateResult>;
  resolvePerson(
    input: RuntimePersonIdentityInput,
  ): Promise<RuntimePersonResolutionResult>;
  getPasswordHash(id: number): Promise<string | null>;
  communityVerificationEvidence(id: number): Promise<Date | null>;
  deactivateAndRevokeSessions(id: number): Promise<User>;
  updateProfile(id: number, data: UserUpdateData): Promise<User>;
  linkAccountToPerson(data: AccountPersonLinkData): Promise<User>;
  updateStatus(id: number, status: UserStatus): Promise<User>;
  updateSubscriptionExpirationDate(id: number, value: Date): Promise<User>;
  updateRole(id: number, roleId: number): Promise<User>;
  resetTemporaryLock(id: number): Promise<User>;
  countActiveAdministrators(excludeUserId: number): Promise<number>;
  countAdministrators(): Promise<number>;
}
