import {
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma, RequestStatus } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAffiliateRequestDto } from './dto/create-affiliate-request.dto';
import { QueryAffiliateRequestsDto } from './dto/query-affiliate-requests.dto';

const select = {
  id: true,
  fullName: true,
  identification: true,
  identificationType: true,
  birthDate: true,
  gender: true,
  phoneCountryCode: true,
  phoneNationalNumber: true,
  phone: true,
  email: true,
  address: true,
  occupation: true,
  workplace: true,
  affiliationReason: true,
  status: true,
  rejectionReason: true,
  reviewedAt: true,
  reviewedById: true,
  reviewedBy: { select: { id: true, fullName: true, email: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AffiliateRequestSelect;
@Injectable()
export class AffiliateRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly audit?: AuditService,
  ) {}
  async create(dto: CreateAffiliateRequestDto, context: AuditContext = {}) {
    await this.assertNoDuplicates(dto.identification, dto.email);
    const created = await this.prisma.affiliateRequest.create({
      data: { ...dto, status: 'PENDING' },
      select,
    });
    await this.audit?.log({
      action: AuditAction.AFFILIATE_REQUEST_CREATED,
      module: 'AFFILIATE_REQUESTS',
      entityType: 'AffiliateRequest',
      entityId: created.id,
      ...context,
    });
    return created;
  }
  async findAll(query: QueryAffiliateRequestsDto) {
    const where: Prisma.AffiliateRequestWhereInput = {
      status: query.status,
      email: query.email,
      identification: query.identification,
      OR: query.search
        ? [
            { fullName: { contains: query.search, mode: 'insensitive' } },
            { identification: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.affiliateRequest.findMany({
        where,
        select,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.affiliateRequest.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }
  async findOne(id: number) {
    const item = await this.prisma.affiliateRequest.findUnique({
      where: { id },
      select,
    });
    if (!item) throw new NotFoundException('Affiliate request not found');
    return item;
  }
  async approve(id: number, actorId: number, context: AuditContext = {}) {
    const request = await this.requirePending(id);
    await this.assertNoAffiliate(request.identification, request.email);
    const result = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.affiliateRequest.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          status: 'APPROVED',
          rejectionReason: null,
          reviewedAt: new Date(),
          reviewedById: actorId,
        },
      });
      if (claimed.count !== 1)
        throw new ConflictException(
          'Affiliate request has already been resolved',
        );
      const affiliate = await tx.affiliate.create({
        data: {
          fullName: request.fullName,
          identification: request.identification,
          identificationType: request.identificationType,
          birthDate: request.birthDate,
          gender: request.gender,
          phoneCountryCode: request.phoneCountryCode,
          phoneNationalNumber: request.phoneNationalNumber,
          email: request.email,
          address: request.address,
          occupation: request.occupation,
          workplace: request.workplace,
        },
      });
      return {
        affiliate,
        affiliateRequest: await tx.affiliateRequest.findUniqueOrThrow({
          where: { id },
          select,
        }),
      };
    });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.AFFILIATE_CREATED,
      module: 'AFFILIATES',
      entityType: 'Affiliate',
      entityId: result.affiliate.id,
      ...context,
    });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.AFFILIATE_REQUEST_APPROVED,
      module: 'AFFILIATE_REQUESTS',
      entityType: 'AffiliateRequest',
      entityId: id,
      details: { affiliateId: result.affiliate.id },
      ...context,
    });
    return result;
  }
  async reject(
    id: number,
    rejectionReason: string,
    actorId: number,
    context: AuditContext = {},
  ) {
    await this.requirePending(id);
    const result = await this.prisma.affiliateRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: 'REJECTED',
        rejectionReason,
        reviewedAt: new Date(),
        reviewedById: actorId,
      },
    });
    if (result.count !== 1)
      throw new ConflictException(
        'Affiliate request has already been resolved',
      );
    const rejected = await this.findOne(id);
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.AFFILIATE_REQUEST_REJECTED,
      module: 'AFFILIATE_REQUESTS',
      entityType: 'AffiliateRequest',
      entityId: id,
      ...context,
    });
    return rejected;
  }
  private async requirePending(id: number) {
    const item = await this.prisma.affiliateRequest.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException('Affiliate request not found');
    if (item.status !== RequestStatus.PENDING)
      throw new ConflictException(
        'Affiliate request has already been resolved',
      );
    return item;
  }
  private async assertNoDuplicates(identification: string, email?: string) {
    await this.assertNoAffiliate(identification, email);
    const duplicate = await this.prisma.affiliateRequest.findFirst({
      where: {
        status: 'PENDING',
        OR: [
          { identification },
          ...(email
            ? [{ email: { equals: email, mode: 'insensitive' as const } }]
            : []),
        ],
      },
      select: { id: true },
    });
    if (duplicate)
      throw new ConflictException('A pending affiliate request already exists');
  }
  private async assertNoAffiliate(
    identification: string,
    email?: string | null,
  ) {
    const duplicate = await this.prisma.affiliate.findFirst({
      where: {
        OR: [
          { identification },
          ...(email
            ? [{ email: { equals: email, mode: 'insensitive' as const } }]
            : []),
        ],
      },
      select: { id: true },
    });
    if (duplicate)
      throw new ConflictException('Affiliate is already registered');
  }
}
