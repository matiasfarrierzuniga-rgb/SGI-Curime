import { Injectable, Optional } from '@nestjs/common';
import {
  Prisma,
  PrismaClient,
  UserStatus,
} from '../../../../generated/prisma/client';
import { getAccountLockoutPolicy, lockoutCutoff } from '../../../auth';
import { ROLE_NAMES } from '../../../common/security/roles';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  User,
  UserRole,
  UserStatus as DomainUserStatus,
} from '../domain/entities/user';
import { EmailAlreadyRegisteredError } from '../domain/errors/email-already-registered.error';
import {
  UserPage,
  UserQuery,
  UserUpdateData,
  UsersRepository,
} from '../domain/repositories/users-repository';

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
  lockedAt: true,
  roleId: true,
  role: {
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

type SafeUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

function toUser(user: SafeUser): User {
  return {
    id: user.id,
    fullName: user.fullName,
    identification: user.identification,
    identificationType: user.identificationType,
    email: user.email,
    phoneCountryCode: user.phoneCountryCode,
    phoneNationalNumber: user.phoneNationalNumber,
    phone: user.phone,
    address: user.address,
    status: user.status as DomainUserStatus,
    lockedAt: user.lockedAt,
    roleId: user.roleId,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  private readonly lockoutMinutes: number;
  constructor(
    private readonly prisma: PrismaService,
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
        return work(new PrismaUsersRepository(this.prisma, tx));
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async findPage(query: UserQuery): Promise<UserPage> {
    const where = this.toWhere(query);
    const skip = (query.page - 1) * query.limit;
    const [users, total] = await Promise.all([
      this.db.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.db.user.count({ where }),
    ]);
    return {
      data: users.map(toUser),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.db.user.findUnique({
      where: { id },
      select: userSelect,
    });
    return user ? toUser(user) : null;
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

  async findRoleById(id: number): Promise<UserRole | null> {
    const role = await this.db.role.findUnique({
      where: { id },
      select: { id: true, name: true, description: true, isActive: true },
    });
    return role;
  }

  async getPasswordHash(id: number): Promise<string | null> {
    const user = await this.db.user.findUnique({
      where: { id },
      select: { passwordHash: true },
    });
    return user?.passwordHash ?? null;
  }

  async updateProfile(id: number, data: UserUpdateData): Promise<User> {
    try {
      const user = await this.db.user.update({
        where: { id },
        data,
        select: userSelect,
      });
      return toUser(user);
    } catch (error) {
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

  async updateRole(id: number, roleId: number): Promise<User> {
    const user = await this.db.user.update({
      where: { id },
      data: { roleId },
      select: userSelect,
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
        role: { name: ROLE_NAMES.ADMIN },
      },
    });
  }

  private toWhere(query: UserQuery): Prisma.UserWhereInput {
    const cutoff = lockoutCutoff(this.lockoutMinutes);
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
      fullName: query.name
        ? { contains: query.name, mode: 'insensitive' }
        : undefined,
      email: query.email
        ? { contains: query.email, mode: 'insensitive' }
        : undefined,
      identification: query.identification
        ? { contains: query.identification, mode: 'insensitive' }
        : undefined,
      status: query.status,
      roleId: query.roleId,
      AND: blockedCondition ? [blockedCondition] : undefined,
    };
  }
}
