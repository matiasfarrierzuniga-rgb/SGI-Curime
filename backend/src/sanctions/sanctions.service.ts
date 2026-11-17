import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { formatInstitutionalPersonName } from '../common/identity/person-name';
import {
  CreateSanctionDto,
  QuerySanctionsDto,
  UpdateSanctionDto,
} from './dto/sanction.dto';
const select = {
  id: true,
  reason: true,
  description: true,
  date: true,
  status: true,
  affiliateId: true,
  affiliate: {
    select: { id: true, identification: true, status: true, person: { select: { firstName: true, firstSurname: true, secondSurname: true } } },
  },
  createdById: true,
  createdBy: { select: { id: true, displayName: true, email: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AffiliateSanctionSelect;

type SanctionAffiliateSource = {
  id: number;
  identification: string;
  status: string;
  person: {
    firstName: string | null;
    firstSurname: string | null;
    secondSurname: string | null;
  } | null;
};

/**
 * Presentation-only projection. The institutional name is derived exclusively
 * from the canonical Person fields; the internal Person object is not exposed.
 */
function toSanctionResponse<
  T extends { affiliate: SanctionAffiliateSource | null },
>(sanction: T) {
  const { affiliate, ...rest } = sanction;
  return {
    ...rest,
    affiliate: affiliate
      ? {
          id: affiliate.id,
          identification: affiliate.identification,
          status: affiliate.status,
          institutionalName: affiliate.person
            ? formatInstitutionalPersonName(affiliate.person)
            : null,
        }
      : null,
  };
}

@Injectable()
export class SanctionsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly audit?: AuditService,
  ) {}
  async create(
    affiliateId: number,
    dto: CreateSanctionDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { id: affiliateId },
      select: { id: true },
    });
    if (!affiliate) throw new NotFoundException('Affiliate not found');
    const item = await this.prisma.affiliateSanction.create({
      data: { affiliateId, createdById: actorId, ...dto },
      select,
    });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.SANCTION_CREATED,
      module: 'SANCTIONS',
      entityType: 'AffiliateSanction',
      entityId: item.id,
      ...context,
    });
    return toSanctionResponse(item);
  }
  async findAll(q: QuerySanctionsDto) {
    const where: Prisma.AffiliateSanctionWhereInput = {
      affiliateId: q.affiliateId,
      status: q.status,
      date:
        q.dateFrom || q.dateTo ? { gte: q.dateFrom, lte: q.dateTo } : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.affiliateSanction.findMany({
        where,
        select,
        orderBy: { date: 'desc' },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      this.prisma.affiliateSanction.count({ where }),
    ]);
    return {
      data: data.map(toSanctionResponse),
      total,
      page: q.page,
      limit: q.limit,
    };
  }
  async findOne(id: number) {
    const item = await this.prisma.affiliateSanction.findUnique({
      where: { id },
      select,
    });
    if (!item) throw new NotFoundException('Sanction not found');
    return toSanctionResponse(item);
  }
  async update(
    id: number,
    dto: UpdateSanctionDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    await this.findOne(id);
    const item = await this.prisma.affiliateSanction.update({
      where: { id },
      data: dto,
      select,
    });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.SANCTION_UPDATED,
      module: 'SANCTIONS',
      entityType: 'AffiliateSanction',
      entityId: id,
      details: { fields: Object.keys(dto) },
      ...context,
    });
    return toSanctionResponse(item);
  }
}
