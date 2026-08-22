import {
  ConflictException,
  Injectable,
  Optional,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RequestStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivationTokenDeliveryService } from './activation-token-delivery.service';
import { ActivationTokenService } from './activation-token.service';
import { CreateUserRequestDto } from './dto/create-user-request.dto';
import { ApproveUserRequestDto } from './dto/review-user-request.dto';
import { QueryUserRequestDto } from './dto/query-user-request.dto';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';

const requestSelect = {
  id: true,
  fullName: true,
  identification: true,
  identificationType: true,
  email: true,
  phoneCountryCode: true,
  phoneNationalNumber: true,
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
    @Optional() private readonly audit?: AuditService,
  ) {}

  async create(dto: CreateUserRequestDto, context: AuditContext = {}) {
    await this.assertNoUserDuplicates(dto.email, dto.identification);
    await this.assertNoPendingDuplicates(dto.email, dto.identification);

    const created = await this.prisma.userRequest.create({
      data: { ...dto, status: 'PENDING' },
      select: requestSelect,
    });
    await this.audit?.log({
      action: AuditAction.USER_REQUEST_CREATED,
      module: 'USER_REQUESTS',
      entityType: 'UserRequest',
      entityId: created.id,
      ...context,
    });
    return created;
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

  async reject(
    id: number,
    rejectionReason: string,
    reviewedById: number,
    context: AuditContext = {},
  ) {
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
    const rejected = await this.findOne(id);
    await this.audit?.log({
      userId: reviewedById,
      action: AuditAction.USER_REQUEST_REJECTED,
      module: 'USER_REQUESTS',
      entityType: 'UserRequest',
      entityId: id,
      ...context,
    });
    return rejected;
  }

  async approve(
    id: number,
    dto: ApproveUserRequestDto,
    reviewedById: number,
    context: AuditContext = {},
  ) {
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
          identificationType: userRequest.identificationType,
          email: userRequest.email,
          phoneCountryCode: userRequest.phoneCountryCode,
          phoneNationalNumber: userRequest.phoneNationalNumber,
          address: userRequest.address,
          passwordHash: null,
          status: 'INACTIVE',
          roleId: role.id,
        },
        select: {
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
    await this.audit?.log({
      userId: reviewedById,
      action: AuditAction.USER_CREATED,
      module: 'USERS',
      entityType: 'User',
      entityId: result.user.id,
      details: { roleId: role.id },
      ...context,
    });
    await this.audit?.log({
      userId: reviewedById,
      action: AuditAction.USER_REQUEST_APPROVED,
      module: 'USER_REQUESTS',
      entityType: 'UserRequest',
      entityId: id,
      details: { createdUserId: result.user.id },
      ...context,
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
      this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } }),
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
        where: { email: { equals: email, mode: 'insensitive' }, status: 'PENDING' },
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
