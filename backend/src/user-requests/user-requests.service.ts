import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RequestStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivationTokenDeliveryService } from './activation-token-delivery.service';
import { ActivationTokenService } from './activation-token.service';
import { CreateUserRequestDto } from './dto/create-user-request.dto';
import { ApproveUserRequestDto } from './dto/review-user-request.dto';
import { QueryUserRequestDto } from './dto/query-user-request.dto';

const requestSelect = {
  id: true,
  fullName: true,
  identification: true,
  email: true,
  phone: true,
  address: true,
  reason: true,
  status: true,
  rejectionReason: true,
  reviewedAt: true,
  reviewedById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserRequestSelect;

@Injectable()
export class UserRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: ActivationTokenService,
    private readonly tokenDelivery: ActivationTokenDeliveryService,
  ) {}

  async create(dto: CreateUserRequestDto) {
    await this.assertNoUserDuplicates(dto.email, dto.identification);
    await this.assertNoPendingDuplicates(dto.email, dto.identification);

    return this.prisma.userRequest.create({
      data: { ...dto, status: 'PENDING' },
      select: requestSelect,
    });
  }

  async findAll(query: QueryUserRequestDto) {
    const where: Prisma.UserRequestWhereInput = {
      status: query.status,
      email: query.email,
      identification: query.identification,
    };
    const skip = (query.page - 1) * query.limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.userRequest.findMany({
        where,
        select: requestSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.userRequest.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number) {
    const userRequest = await this.prisma.userRequest.findUnique({
      where: { id },
      select: requestSelect,
    });
    if (!userRequest) throw new NotFoundException('User request not found');
    return userRequest;
  }

  async reject(id: number, rejectionReason: string, reviewedById: number) {
    await this.requirePending(id);
    const result = await this.prisma.userRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: 'REJECTED',
        rejectionReason,
        reviewedAt: new Date(),
        reviewedById,
      },
    });
    if (result.count !== 1) {
      throw new ConflictException('User request has already been resolved');
    }
    return this.findOne(id);
  }

  async approve(id: number, dto: ApproveUserRequestDto, reviewedById: number) {
    const userRequest = await this.requirePending(id);
    await this.assertNoUserDuplicates(
      userRequest.email,
      userRequest.identification,
    );
    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (!role.isActive) throw new ConflictException('Role is inactive');

    const generated = this.tokenService.generate();
    const reviewedAt = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.userRequest.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          status: 'APPROVED',
          rejectionReason: null,
          reviewedAt,
          reviewedById,
        },
      });
      if (claimed.count !== 1) {
        throw new ConflictException('User request has already been resolved');
      }
      const user = await tx.user.create({
        data: {
          fullName: userRequest.fullName,
          identification: userRequest.identification,
          email: userRequest.email,
          phone: userRequest.phone,
          address: userRequest.address,
          passwordHash: null,
          status: 'INACTIVE',
          roleId: role.id,
        },
        select: {
          id: true,
          fullName: true,
          identification: true,
          email: true,
          phone: true,
          address: true,
          status: true,
          roleId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      await tx.accountActivationToken.create({
        data: {
          userId: user.id,
          tokenHash: generated.tokenHash,
          expiresAt: generated.expiresAt,
        },
      });
      const approvedRequest = await tx.userRequest.findUniqueOrThrow({
        where: { id },
        select: requestSelect,
      });
      return { user, userRequest: approvedRequest };
    });

    await this.tokenDelivery.deliver({
      email: result.user.email,
      fullName: result.user.fullName,
      token: generated.token,
      expiresAt: generated.expiresAt,
    });
    return result;
  }

  private async requirePending(id: number) {
    const userRequest = await this.prisma.userRequest.findUnique({
      where: { id },
    });
    if (!userRequest) throw new NotFoundException('User request not found');
    if (userRequest.status !== RequestStatus.PENDING) {
      throw new ConflictException('User request has already been resolved');
    }
    return userRequest;
  }

  private async assertNoUserDuplicates(email: string, identification: string) {
    const [byEmail, byIdentification] = await Promise.all([
      this.prisma.user.findUnique({ where: { email }, select: { id: true } }),
      this.prisma.user.findUnique({
        where: { identification },
        select: { id: true },
      }),
    ]);
    if (byEmail) throw new ConflictException('Email is already registered');
    if (byIdentification) {
      throw new ConflictException('Identification is already registered');
    }
  }

  private async assertNoPendingDuplicates(
    email: string,
    identification: string,
  ) {
    const [byEmail, byIdentification] = await Promise.all([
      this.prisma.userRequest.findFirst({
        where: { email, status: 'PENDING' },
        select: { id: true },
      }),
      this.prisma.userRequest.findFirst({
        where: { identification, status: 'PENDING' },
        select: { id: true },
      }),
    ]);
    if (byEmail)
      throw new ConflictException('A pending request already uses this email');
    if (byIdentification) {
      throw new ConflictException(
        'A pending request already uses this identification',
      );
    }
  }
}
