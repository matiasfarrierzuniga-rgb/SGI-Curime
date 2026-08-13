import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const ADMIN_ROLE = 'Administrador';

const userSelect = {
  id: true,
  fullName: true,
  identification: true,
  email: true,
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

function sanitizeUser(user: SafeUser) {
  return {
    ...user,
    isBlocked: user.status === UserStatus.BLOCKED || user.lockedAt !== null,
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryUsersDto) {
    const blockedCondition: Prisma.UserWhereInput | undefined =
      query.blocked === true
        ? { OR: [{ status: UserStatus.BLOCKED }, { lockedAt: { not: null } }] }
        : query.blocked === false
          ? {
              AND: [
                { status: { not: UserStatus.BLOCKED } },
                { lockedAt: null },
              ],
            }
          : undefined;
    const where: Prisma.UserWhereInput = {
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
    const skip = (query.page - 1) * query.limit;
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(sanitizeUser),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return sanitizeUser(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('At least one editable field is required');
    }
    await this.requireUser(id);
    if (dto.email) {
      const duplicate = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: id } },
        select: { id: true },
      });
      if (duplicate) throw new ConflictException('Email is already registered');
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: dto,
        select: userSelect,
      });
      return sanitizeUser(user);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  async changeRole(id: number, roleId: number) {
    return this.prisma.$transaction(
      async (tx) => {
        const [user, role] = await Promise.all([
          tx.user.findUnique({
            where: { id },
            select: {
              id: true,
              status: true,
              role: { select: { name: true } },
            },
          }),
          tx.role.findUnique({ where: { id: roleId } }),
        ]);
        if (!user) throw new NotFoundException('User not found');
        if (!role) throw new NotFoundException('Role not found');
        if (!role.isActive) throw new ConflictException('Role is inactive');

        if (
          user.status === UserStatus.ACTIVE &&
          user.role.name === ADMIN_ROLE &&
          role.name !== ADMIN_ROLE
        ) {
          await this.assertAnotherActiveAdministrator(tx, id);
        }

        const updated = await tx.user.update({
          where: { id },
          data: { roleId },
          select: userSelect,
        });
        return sanitizeUser(updated);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async activate(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, passwordHash: true, status: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.passwordHash) {
      throw new ConflictException('Account activation has not been completed');
    }
    if (user.status === UserStatus.ACTIVE) {
      throw new ConflictException('User is already active');
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE },
      select: userSelect,
    });
    return sanitizeUser(updated);
  }

  async deactivate(id: number) {
    return this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id },
          select: { id: true, status: true, role: { select: { name: true } } },
        });
        if (!user) throw new NotFoundException('User not found');
        if (user.status === UserStatus.INACTIVE) {
          throw new ConflictException('User is already inactive');
        }
        if (
          user.status === UserStatus.ACTIVE &&
          user.role.name === ADMIN_ROLE
        ) {
          await this.assertAnotherActiveAdministrator(tx, id);
        }
        const updated = await tx.user.update({
          where: { id },
          data: { status: UserStatus.INACTIVE },
          select: userSelect,
        });
        return sanitizeUser(updated);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async requireUser(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async assertAnotherActiveAdministrator(
    tx: Prisma.TransactionClient,
    excludedUserId: number,
  ) {
    const count = await tx.user.count({
      where: {
        id: { not: excludedUserId },
        status: UserStatus.ACTIVE,
        role: { name: ADMIN_ROLE },
      },
    });
    if (count === 0) {
      throw new ConflictException(
        'The last active administrator cannot be deactivated or demoted',
      );
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
