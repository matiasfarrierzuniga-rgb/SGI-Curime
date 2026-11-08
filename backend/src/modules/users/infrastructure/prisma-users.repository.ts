import { ConflictException, Injectable, Optional } from '@nestjs/common';
import { Prisma, PrismaClient, UserStatus } from '../../../../generated/prisma/client';
import { getAccountLockoutPolicy, lockoutCutoff } from '../../../auth';
import { SYSTEM_ADMIN_ROLE } from '../../../auth/domain/policies/canonical-role-catalog';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  PersonLogicalIdentityRaceError,
  RuntimePersonResolverService,
} from '../../../identity/runtime-person-resolver.service';
import {
  AdminPersonReadModel,
  User,
  UserRole,
  UserStatus as DomainUserStatus,
} from '../domain/entities/user';
import { EmailAlreadyRegisteredError } from '../domain/errors/email-already-registered.error';
import {
  AccountPersonLinkData,
  UserCreateData,
  AccountPage,
  PersonLinkCandidate,
  UserPage,
  UserAffiliationContext,
  UserQuery,
  UserUpdateData,
  UsersRepository,
  RegistrationDataConflictError,
} from '../domain/repositories/users-repository';
import { AuditAction } from '../../../audit/audit-actions';
import { AccountPersonLinkConflictError } from '../domain/errors/account-person-link-conflict.error';
import { PersonNotFoundError } from '../domain/errors/person-not-found.error';
import { UserNotFoundError } from '../domain/errors/user-not-found.error';

const userSelect = {
  id: true,
  fullName: true,
  identification: true,
  identificationType: true,
  email: true,
  phoneCountryCode: true,
  phoneNationalNumber: true,
  phone: true,
  address: true,
  status: true,
  subscriptionExpirationDate: true,
  lockedAt: true,
  roleId: true,
  personId: true,
  person: {
    select: {
      id: true,
      firstName: true,
      firstSurname: true,
      secondSurname: true,
      legacyFullName: true,
      identification: true,
      identificationType: true,
      email: true,
      phoneCountryCode: true,
      phoneNationalNumber: true,
      address: true,
      affiliate: { select: { id: true, status: true, legacyRoleId: true } },
    },
  },
  role: {
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      permissions: { select: { permission: { select: { code: true } } } },
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

type SafeUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

const adminPersonSelect = {
  id: true,
  firstName: true,
  firstSurname: true,
  secondSurname: true,
  legacyFullName: true,
  identification: true,
  identificationType: true,
  email: true,
  phoneCountryCode: true,
  phoneNationalNumber: true,
  address: true,
  createdAt: true,
  updatedAt: true,
  affiliate: { select: { id: true, status: true, legacyRoleId: true } },
  user: { select: userSelect },
} satisfies Prisma.PersonSelect;

type SafeAdminPerson = Prisma.PersonGetPayload<{
  select: typeof adminPersonSelect;
}>;

function toUser(user: SafeUser): User {
  const canonicalName = user.person
    ? formatPersonName(user.person) ?? user.person.legacyFullName
    : null;
  return {
    id: user.id,
    fullName: canonicalName ?? user.fullName ?? 'Cuenta comunitaria',
    identification: user.person?.identification ?? user.identification,
    identificationType:
      user.person?.identificationType ?? user.identificationType,
    email: user.email,
    phoneCountryCode:
      user.person?.phoneCountryCode ?? user.phoneCountryCode,
    phoneNationalNumber:
      user.person?.phoneNationalNumber ?? user.phoneNationalNumber,
    phone: user.phone,
    address: user.person?.address ?? user.address,
    status: user.status as DomainUserStatus,
    subscriptionExpirationDate: user.subscriptionExpirationDate,
    lockedAt: user.lockedAt,
    roleId: user.roleId,
    role: user.role,
    personId: user.personId === null ? null : String(user.personId),
    affiliateId:
      user.person?.affiliate?.id === undefined
        ? null
        : String(user.person.affiliate.id),
    person: user.person
      ? { id: String(user.person.id), contactEmail: user.person.email }
      : null,
    affiliate: user.person?.affiliate
      ? {
          id: String(user.person.affiliate.id),
          status: user.person.affiliate.status,
          legacyRoleId: user.person.affiliate.legacyRoleId,
        }
      : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    effectiveCapabilities: (user.role.permissions ?? []).map((entry) => entry.permission.code),
  };
}

function toAdminPerson(person: SafeAdminPerson): AdminPersonReadModel {
  return {
    id: String(person.id),
    fullName: person.legacyFullName ?? formatPersonName(person),
    identification: person.identification,
    identificationType: person.identificationType,
    contactEmail: person.email,
    phoneCountryCode: person.phoneCountryCode,
    phoneNationalNumber: person.phoneNationalNumber,
    address: person.address,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
    access: person.user ? toUser(person.user) : null,
    affiliate: person.affiliate
      ? {
          id: String(person.affiliate.id),
          status: person.affiliate.status,
          legacyRoleId: person.affiliate.legacyRoleId,
        }
      : null,
  };
}

function formatPersonName(
  person: Pick<SafeAdminPerson, 'firstName' | 'firstSurname' | 'secondSurname'>,
): string | null {
  const value = [person.firstName, person.firstSurname, person.secondSurname]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(' ');
  return value || null;
}

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  private readonly lockoutMinutes: number;
  constructor(
    private readonly prisma: PrismaService,
    private readonly personResolver: RuntimePersonResolverService,
    @Optional()
    private readonly db: PrismaClient | Prisma.TransactionClient = prisma,
  ) {
    this.lockoutMinutes = getAccountLockoutPolicy().lockoutMinutes;
  }

  async withTransaction<T>(
    work: (repo: UsersRepository) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(
      async (tx) => {
        return work(
          new PrismaUsersRepository(this.prisma, this.personResolver, tx),
        );
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async withRegistrationTransaction<T>(
    work: (repo: UsersRepository) => Promise<T>,
  ): Promise<T> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) =>
            work(
              new PrismaUsersRepository(this.prisma, this.personResolver, tx),
            ),
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        if (!isRetriableRegistrationConflict(error)) {
          throw error;
        }
        if (attempt === maxAttempts) {
          throw error instanceof PersonLogicalIdentityRaceError
            ? new RegistrationDataConflictError('PERSON_LOGICAL_IDENTITY_RACE')
            : error;
        }
      }
    }
    throw new Error('Registration transaction retry exhausted.');
  }

  async findPage(query: UserQuery): Promise<UserPage> {
    const where = this.toWhere(query);
    const skip = (query.page - 1) * query.limit;
    const [persons, total] = await Promise.all([
      this.db.person.findMany({
        where,
        select: adminPersonSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.db.person.count({ where }),
    ]);
    return {
      data: persons.map(toAdminPerson),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findAccountsPage(query: UserQuery): Promise<AccountPage> {
    const where = this.toAccountWhere(query);
    const skip = (query.page - 1) * query.limit;
    const [accounts, total] = await Promise.all([
      this.db.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.db.user.count({ where }),
    ]);
    return { data: accounts.map(toUser), total, page: query.page, limit: query.limit };
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.db.user.findUnique({
      where: { id },
      select: userSelect,
    });
    return user ? toUser(user) : null;
  }

  async findAdminPersonById(id: number): Promise<AdminPersonReadModel | null> {
    const person = await this.db.person.findUnique({
      where: { id },
      select: adminPersonSelect,
    });
    return person ? toAdminPerson(person) : null;
  }

  async findAffiliationContext(id: number): Promise<UserAffiliationContext> {
    const account = await this.db.user.findUnique({
      where: { id },
      select: {
        person: {
          select: {
            affiliate: {
              select: { id: true, status: true, legacyRoleId: true },
            },
            affiliateRequests: {
              select: { status: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });
    const affiliate = account?.person?.affiliate;
    return {
      affiliateId: affiliate?.id ?? null,
      affiliateStatus: affiliate?.status ?? null,
      affiliateRoleId: affiliate?.legacyRoleId ?? null,
      affiliateRequestStatus:
        account?.person?.affiliateRequests[0]?.status ?? null,
      hasPerson: account?.person !== null && account?.person !== undefined,
    };
  }

  async findByEmail(
    email: string,
    excludeId?: number,
  ): Promise<{ id: number } | null> {
    return this.db.user.findFirst({
      where: { email, id: excludeId ? { not: excludeId } : undefined },
      select: { id: true },
    });
  }

  async findByPersonId(personId: number): Promise<{ id: number } | null> {
    return this.db.user.findUnique({
      where: { personId },
      select: { id: true },
    });
  }

  async findRoleById(id: number): Promise<UserRole | null> {
    const role = await this.db.role.findUnique({
      where: { id },
      select: { id: true, name: true, description: true, isActive: true },
    });
    return role;
  }

  async findRoleByName(name: string): Promise<UserRole | null> {
    return this.db.role.findUnique({
      where: { name },
      select: { id: true, name: true, description: true, isActive: true },
    });
  }

  async create(data: UserCreateData): Promise<User> {
    try {
      const user = await this.db.user.create({ data, select: userSelect });
      return toUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new RegistrationDataConflictError(classifyUserUnique(error));
      }
      throw error;
    }
  }

  resolvePerson(input: Parameters<RuntimePersonResolverService['resolve']>[0]) {
    if (this.db === this.prisma) {
      return this.personResolver.resolve(input, this.db);
    }
    return this.personResolver.resolveWithinTransaction(input, this.db);
  }

  async getPasswordHash(id: number): Promise<string | null> {
    const user = await this.db.user.findUnique({
      where: { id },
      select: { passwordHash: true },
    });
    return user?.passwordHash ?? null;
  }

  async communityVerificationEvidence(id: number): Promise<Date | null> {
    return (
      (
        await this.db.user.findUnique({
          where: { id },
          select: { communityEmailVerifiedAt: true },
        })
      )?.communityEmailVerifiedAt ?? null
    );
  }

  async deactivateAndRevokeSessions(id: number): Promise<User> {
    const now = new Date();
    const user = await this.db.user.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        sessionsInvalidBefore: now,
        sessionGeneration: { increment: 1 },
      },
      select: userSelect,
    });
    await this.db.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: now, revocationReason: 'account-deactivated' },
    });
    await this.db.passwordResetToken.updateMany({
      where: { userId: id, usedAt: null },
      data: { usedAt: now },
    });
    return toUser(user);
  }

  async updateProfile(id: number, data: UserUpdateData): Promise<User> {
    try {
      const user = await this.db.user.update({
        where: {
          id,
          ...(data.email !== undefined
            ? { status: { not: UserStatus.PENDING_EMAIL_VERIFICATION } }
            : {}),
        },
        data,
        select: userSelect,
      });
      return toUser(user);
    } catch (error) {
      if (
        data.email !== undefined &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ConflictException(
          'El correo de una cuenta pendiente debe corregirse mediante verificación institucional.',
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new EmailAlreadyRegisteredError();
      }
      throw error;
    }
  }

  async updateStatus(id: number, status: DomainUserStatus): Promise<User> {
    const user = await this.db.user.update({
      where: { id },
      data: { status },
      select: userSelect,
    });
    return toUser(user);
  }

  async updateSubscriptionExpirationDate(
    id: number,
    value: Date,
  ): Promise<User> {
    const user = await this.db.user.update({
      where: { id },
      data: { subscriptionExpirationDate: value },
      select: userSelect,
    });
    return toUser(user);
  }

  async updateRole(id: number, roleId: number): Promise<User> {
    const now = new Date();
    const user = await this.db.user.update({
      where: { id },
      data: {
        roleId,
        sessionGeneration: { increment: 1 },
        sessionsInvalidBefore: now,
      },
      select: userSelect,
    });
    await this.db.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: now, revocationReason: 'role-changed' },
    });
    return toUser(user);
  }

  async resetTemporaryLock(id: number): Promise<User> {
    const user = await this.db.user.update({
      where: { id },
      data: { failedLoginAttempts: 0, lockedAt: null },
      select: userSelect,
    });
    return toUser(user);
  }

  async countActiveAdministrators(excludeUserId: number): Promise<number> {
    return this.db.user.count({
      where: {
        id: { not: excludeUserId },
        status: UserStatus.ACTIVE,
        role: { name: SYSTEM_ADMIN_ROLE },
      },
    });
  }

  async countAdministrators(): Promise<number> {
    return this.db.user.count({
      where: { role: { name: SYSTEM_ADMIN_ROLE } },
    });
  }

  private toWhere(query: UserQuery): Prisma.PersonWhereInput {
    const cutoff = lockoutCutoff(this.lockoutMinutes);
    const textConditions: Prisma.PersonWhereInput[] = [];
    if (query.name) {
      textConditions.push({
        OR: [
          { legacyFullName: { contains: query.name, mode: 'insensitive' } },
          { firstName: { contains: query.name, mode: 'insensitive' } },
          { firstSurname: { contains: query.name, mode: 'insensitive' } },
          { secondSurname: { contains: query.name, mode: 'insensitive' } },
        ],
      });
    }
    if (query.email) {
      textConditions.push({
        OR: [
          { email: { contains: query.email, mode: 'insensitive' } },
          {
            user: {
              is: { email: { contains: query.email, mode: 'insensitive' } },
            },
          },
        ],
      });
    }
    const blockedCondition: Prisma.UserWhereInput | undefined =
      query.blocked === true
        ? {
            OR: [{ status: UserStatus.BLOCKED }, { lockedAt: { gt: cutoff } }],
          }
        : query.blocked === false
          ? {
              AND: [
                { status: { not: UserStatus.BLOCKED } },
                {
                  OR: [{ lockedAt: null }, { lockedAt: { lte: cutoff } }],
                },
              ],
            }
          : undefined;
    return {
      AND: textConditions.length > 0 ? textConditions : undefined,
      identification: query.identification
        ? { contains: query.identification, mode: 'insensitive' }
        : undefined,
      user:
        query.status || query.roleId || blockedCondition
          ? {
              is: {
                status: query.status,
                roleId: query.roleId,
                AND: blockedCondition ? [blockedCondition] : undefined,
              },
            }
          : undefined,
    };
  }

  async findLinkablePersonCandidates(query: string): Promise<PersonLinkCandidate[]> {
    const people = await this.db.person.findMany({
      where: {
        user: { is: null },
        OR: [
          { legacyFullName: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { firstSurname: { contains: query, mode: 'insensitive' } },
          { identification: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        firstSurname: true,
        secondSurname: true,
        legacyFullName: true,
        identification: true,
        affiliate: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return people.map((person) => ({
      id: person.id,
      displayName:
        person.legacyFullName ?? formatPersonName(person) ?? `Persona ${person.id}`,
      identificationHint: person.identification
        ? `••••${person.identification.replace(/\D/g, '').slice(-4)}`
        : null,
      affiliateStatus: person.affiliate?.status ?? null,
    }));
  }

  async linkAccountToPerson(data: AccountPersonLinkData): Promise<User> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: data.userId },
          select: { id: true, personId: true },
        });
        if (!user) throw new UserNotFoundError();
        if (user.personId !== null) throw new AccountPersonLinkConflictError();

        const person = await tx.person.findUnique({
          where: { id: data.personId },
          select: { id: true },
        });
        if (!person) throw new PersonNotFoundError();

        const linked = await tx.user.findUnique({
          where: { personId: data.personId },
          select: { id: true },
        });
        if (linked) throw new AccountPersonLinkConflictError();

        const updated = await tx.user.updateMany({
          where: { id: data.userId, personId: null },
          data: { personId: data.personId },
        });
        if (updated.count !== 1) throw new AccountPersonLinkConflictError();

        await tx.auditLog.create({
          data: {
            userId: data.actorId,
            action: AuditAction.USER_PERSON_LINKED,
            module: 'IDENTITY',
            entityType: 'User',
            entityId: String(data.userId),
            details: {
              personId: data.personId,
              verificationMethod: 'ADMINISTRATIVE_REVIEW',
              evidenceReference: data.evidenceReference,
              reason: data.reason,
            },
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
          },
        });

        const result = await tx.user.findUnique({
          where: { id: data.userId },
          select: userSelect,
        });
        if (!result) throw new UserNotFoundError();
        return toUser(result);
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2002' || error.code === 'P2034')
      ) {
        throw new AccountPersonLinkConflictError();
      }
      throw error;
    }
  }

  private toAccountWhere(query: UserQuery): Prisma.UserWhereInput {
    const cutoff = lockoutCutoff(this.lockoutMinutes);
    const textConditions: Prisma.UserWhereInput[] = [];
    if (query.name) {
      textConditions.push({
        OR: [
          { fullName: { contains: query.name, mode: 'insensitive' } },
          { person: { is: { legacyFullName: { contains: query.name, mode: 'insensitive' } } } },
          { person: { is: { firstName: { contains: query.name, mode: 'insensitive' } } } },
          { person: { is: { firstSurname: { contains: query.name, mode: 'insensitive' } } } },
        ],
      });
    }
    if (query.email) textConditions.push({ email: { contains: query.email, mode: 'insensitive' } });
    return {
      AND: textConditions.length ? textConditions : undefined,
      identification: query.identification ? { contains: query.identification, mode: 'insensitive' } : undefined,
      status: query.status,
      roleId: query.roleId,
      ...(query.blocked === true ? { OR: [{ status: UserStatus.BLOCKED }, { lockedAt: { gt: cutoff } }] } : {}),
      ...(query.blocked === false ? { AND: [...textConditions, { status: { not: UserStatus.BLOCKED } }, { OR: [{ lockedAt: null }, { lockedAt: { lte: cutoff } }] }] } : {}),
    };
  }
}

function isRetriableRegistrationConflict(error: unknown): boolean {
  return (
    error instanceof PersonLogicalIdentityRaceError ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034')
  );
}

function classifyUserUnique(
  error: Prisma.PrismaClientKnownRequestError,
):
  | 'USER_EMAIL_RACE'
  | 'USER_PERSON_RACE'
  | 'LEGACY_USER_IDENTIFICATION_CONFLICT'
  | 'UNEXPECTED_USER_UNIQUE_CONFLICT' {
  const target = JSON.stringify(error.meta ?? '').toLowerCase();
  if (target.includes('personid')) return 'USER_PERSON_RACE';
  if (target.includes('email')) return 'USER_EMAIL_RACE';
  if (target.includes('identification')) {
    return 'LEGACY_USER_IDENTIFICATION_CONFLICT';
  }
  return 'UNEXPECTED_USER_UNIQUE_CONFLICT';
}
