import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
  decisionNote: true,
  rejectionReason: true,
  reviewedAt: true,
  reviewedById: true,
  attachmentOriginalName: true,
  attachmentMimeType: true,
  attachmentSize: true,
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

  async registerFromAffiliate(
    assemblyId: number,
    affiliateId: number,
    payload: {
      reason: string;
      attachment?: {
        originalName?: string;
        mimeType?: string;
        size?: number;
      };
    },
    actorId: number,
    context: AuditContext = {},
  ) {
    const reason = payload.reason?.trim() ?? '';
    if (!reason || reason.length < 20) {
      throw new BadRequestException(
        'The justification reason must be complete and at least 20 characters long.',
      );
    }

    if (payload.attachment) {
      const { originalName, mimeType, size } = payload.attachment;
      if (!originalName || !mimeType || !size) {
        throw new BadRequestException(
          'Attachment details are incomplete. Please provide a valid file name, type, and size.',
        );
      }
      const validMime = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
      ].includes(mimeType.toLowerCase());
      const validExtension = /\.(pdf|jpg|jpeg|png)$/i.test(originalName);
      const validSize = size > 0 && size <= 5 * 1024 * 1024;
      if (!validMime || !validExtension || !validSize) {
        throw new BadRequestException(
          'The attachment is invalid. Allowed formats: PDF, JPG, JPEG, PNG; maximum size 5 MB.',
        );
      }
    }

    const [assembly, affiliate, attendance, existing] = await Promise.all([
      this.prisma.assembly.findUnique({
        where: { id: assemblyId },
        select: { id: true },
      }),
      this.prisma.affiliate.findFirst({
        where: {
          id: affiliateId,
          person: { user: { id: actorId } },
        },
        select: { id: true },
      }),
      this.prisma.assemblyAttendance.findUnique({
        where: { assemblyId_affiliateId: { assemblyId, affiliateId } },
        select: { status: true },
      }),
      this.prisma.absenceJustification.findUnique({
        where: { assemblyId_affiliateId: { assemblyId, affiliateId } },
        select: { id: true },
      }),
    ]);

    if (!assembly) throw new NotFoundException('Assembly not found');
    if (!affiliate) throw new NotFoundException('Affiliate not found');
    if (attendance?.status !== 'ABSENT') {
      throw new ConflictException(
        'The affiliate must be marked as absent in this assembly before registering a justification.',
      );
    }
    if (existing) {
      throw new ConflictException(
        'A justification already exists for this affiliate and assembly.',
      );
    }

    const item = await this.prisma.absenceJustification.create({
      data: {
        assemblyId,
        affiliateId,
        reason,
        status: 'PENDING',
        attachmentOriginalName: payload.attachment?.originalName,
        attachmentMimeType: payload.attachment?.mimeType,
        attachmentSize: payload.attachment?.size,
      },
      select,
    });

    await this.audit?.log({
      userId: actorId,
      action: AuditAction.JUSTIFICATION_CREATED,
      module: 'ABSENCE_JUSTIFICATIONS',
      entityType: 'AbsenceJustification',
      entityId: item.id,
      details: {
        assemblyId,
        affiliateId,
        hasAttachment: Boolean(payload.attachment),
      },
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
  async findForAffiliate(
    affiliateId: number,
    q: QueryJustificationsDto,
    actorId: number,
  ) {
    const affiliate = await this.prisma.affiliate.findFirst({
      where: { id: affiliateId, person: { user: { id: actorId } } },
      select: { id: true },
    });
    if (!affiliate) {
      throw new ForbiddenException(
        'You are not authorized to view these justifications.',
      );
    }
    return this.findAll({ ...q, affiliateId });
  }
  async findOne(id: number) {
    const item = await this.prisma.absenceJustification.findUnique({
      where: { id },
      select,
    });
    if (!item) throw new NotFoundException('Absence justification not found');
    return item;
  }

  async getEvidence(id: number, actor: { id: number; role: string }) {
    const item = await this.prisma.absenceJustification.findUnique({
      where: { id },
      select: {
        id: true,
        affiliateId: true,
        status: true,
        reason: true,
        createdAt: true,
        attachmentOriginalName: true,
        attachmentMimeType: true,
        attachmentSize: true,
        attachmentUrl: true,
        assembly: { select: { id: true, title: true } },
        affiliate: {
          select: {
            id: true,
            fullName: true,
            person: { select: { user: { select: { id: true } } } },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Absence justification not found');
    }

    const isAdmin = actor.role === 'Administrador';
    const isOwner = item.affiliate.person?.user?.id === actor.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'You are not authorized to access this justification evidence.',
      );
    }

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
  async decide(
    id: number,
    status: JustificationStatus,
    observation: string | null,
    actorId: number,
    context: AuditContext = {},
  ) {
    if (status === JustificationStatus.PENDING) {
      throw new BadRequestException(
        'A justification decision must be approved or rejected.',
      );
    }

    const item = await this.requirePending(id);
    const note = observation?.trim() ?? '';

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.absenceJustification.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          status,
          decisionNote: note || null,
          rejectionReason: status === JustificationStatus.REJECTED ? note || null : null,
          reviewedAt: new Date(),
          reviewedById: actorId,
        },
      });
      if (claimed.count !== 1)
        throw new ConflictException('Justification has already been resolved');

      if (status === JustificationStatus.APPROVED) {
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
      }
    });

    await this.audit?.log({
      userId: actorId,
      action:
        status === JustificationStatus.APPROVED
          ? AuditAction.JUSTIFICATION_APPROVED
          : AuditAction.JUSTIFICATION_REJECTED,
      module: 'ABSENCE_JUSTIFICATIONS',
      entityType: 'AbsenceJustification',
      entityId: id,
      details: {
        status,
        observation: note || null,
      },
      ...context,
    });
    return this.findOne(id);
  }
  async approve(
    id: number,
    observation: string | null = null,
    actorId: number,
    context: AuditContext = {},
  ) {
    return this.decide(
      id,
      JustificationStatus.APPROVED,
      observation,
      actorId,
      context,
    );
  }
  async reject(
    id: number,
    rejectionReason: string,
    actorId: number,
    context: AuditContext = {},
  ) {
    return this.decide(
      id,
      JustificationStatus.REJECTED,
      rejectionReason,
      actorId,
      context,
    );
  }
}
