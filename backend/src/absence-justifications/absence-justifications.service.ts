import {
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { JustificationStatus, Prisma } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateJustificationDto,
  QueryJustificationsDto,
} from './dto/justification.dto';
const select = {
  id: true,
  reason: true,
  status: true,
  rejectionReason: true,
  reviewedAt: true,
  reviewedById: true,
  assemblyId: true,
  affiliateId: true,
  assembly: { select: { id: true, title: true, date: true } },
  affiliate: { select: { id: true, fullName: true, identification: true } },
  reviewedBy: { select: { id: true, fullName: true, email: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AbsenceJustificationSelect;
@Injectable()
export class AbsenceJustificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly audit?: AuditService,
  ) {}
  async create(
    assemblyId: number,
    dto: CreateJustificationDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    const [assembly, affiliate, existing] = await Promise.all([
      this.prisma.assembly.findUnique({
        where: { id: assemblyId },
        select: { id: true },
      }),
      this.prisma.affiliate.findUnique({
        where: { id: dto.affiliateId },
        select: { id: true },
      }),
      this.prisma.absenceJustification.findUnique({
        where: {
          assemblyId_affiliateId: { assemblyId, affiliateId: dto.affiliateId },
        },
        select: { id: true },
      }),
    ]);
    if (!assembly) throw new NotFoundException('Assembly not found');
    if (!affiliate) throw new NotFoundException('Affiliate not found');
    if (existing)
      throw new ConflictException(
        'A justification already exists for this affiliate and assembly',
      );
    const item = await this.prisma.absenceJustification.create({
      data: { assemblyId, ...dto, status: 'PENDING' },
      select,
    });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.JUSTIFICATION_CREATED,
      module: 'ABSENCE_JUSTIFICATIONS',
      entityType: 'AbsenceJustification',
      entityId: item.id,
      ...context,
    });
    return item;
  }
  async findAll(q: QueryJustificationsDto) {
    const where = {
      status: q.status,
      assemblyId: q.assemblyId,
      affiliateId: q.affiliateId,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.absenceJustification.findMany({
        where,
        select,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      this.prisma.absenceJustification.count({ where }),
    ]);
    return { data, total, page: q.page, limit: q.limit };
  }
  async findOne(id: number) {
    const item = await this.prisma.absenceJustification.findUnique({
      where: { id },
      select,
    });
    if (!item) throw new NotFoundException('Absence justification not found');
    return item;
  }
  private async requirePending(id: number) {
    const item = await this.prisma.absenceJustification.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException('Absence justification not found');
    if (item.status !== JustificationStatus.PENDING)
      throw new ConflictException('Justification has already been resolved');
    return item;
  }
  async approve(id: number, actorId: number, context: AuditContext = {}) {
    const item = await this.requirePending(id);
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.absenceJustification.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          status: 'APPROVED',
          rejectionReason: null,
          reviewedAt: new Date(),
          reviewedById: actorId,
        },
      });
      if (claimed.count !== 1)
        throw new ConflictException('Justification has already been resolved');
      await tx.assemblyAttendance.upsert({
        where: {
          assemblyId_affiliateId: {
            assemblyId: item.assemblyId,
            affiliateId: item.affiliateId,
          },
        },
        create: {
          assemblyId: item.assemblyId,
          affiliateId: item.affiliateId,
          status: 'JUSTIFIED',
        },
        update: { status: 'JUSTIFIED', registeredAt: new Date() },
      });
    });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.JUSTIFICATION_APPROVED,
      module: 'ABSENCE_JUSTIFICATIONS',
      entityType: 'AbsenceJustification',
      entityId: id,
      ...context,
    });
    return this.findOne(id);
  }
  async reject(
    id: number,
    rejectionReason: string,
    actorId: number,
    context: AuditContext = {},
  ) {
    await this.requirePending(id);
    const result = await this.prisma.absenceJustification.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: 'REJECTED',
        rejectionReason,
        reviewedAt: new Date(),
        reviewedById: actorId,
      },
    });
    if (result.count !== 1)
      throw new ConflictException('Justification has already been resolved');
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.JUSTIFICATION_REJECTED,
      module: 'ABSENCE_JUSTIFICATIONS',
      entityType: 'AbsenceJustification',
      entityId: id,
      ...context,
    });
    return this.findOne(id);
  }
}
