import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { JustificationStatus, Prisma } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateJustificationDto,
  QueryJustificationsDto,
} from './dto/justification.dto';

type UploadedJustificationFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

const allowedEvidenceMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);
const allowedEvidenceExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png']);
const evidenceDirectory = join(
  process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads'),
  'justifications',
);
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
    const [assembly, affiliate, attendance, existing] = await Promise.all([
      this.prisma.assembly.findUnique({
        where: { id: assemblyId },
        select: {
          id: true,
          status: true,
          convocations: {
            where: { affiliateId: dto.affiliateId },
            select: { id: true },
          },
        },
      }),
      this.prisma.affiliate.findUnique({
        where: { id: dto.affiliateId },
        select: { id: true },
      }),
      this.prisma.assemblyAttendance.findUnique({
        where: {
          assemblyId_affiliateId: { assemblyId, affiliateId: dto.affiliateId },
        },
        select: { status: true },
      }),
      this.prisma.absenceJustification.findUnique({
        where: {
          assemblyId_affiliateId: { assemblyId, affiliateId: dto.affiliateId },
        },
        select: { id: true },
      }),
    ]);
    if (!assembly) throw new NotFoundException('Assembly not found');
    if (assembly.status !== 'COMPLETED')
      throw new ConflictException('Only a completed assembly can be justified');
    if (assembly.convocations.length === 0)
      throw new ConflictException(
        'Only a convoked person can justify an absence',
      );
    if (!affiliate) throw new NotFoundException('Affiliate not found');
    if (attendance?.status !== 'ABSENT') {
      throw new ConflictException(
        'The affiliate must be marked as absent before registering a justification.',
      );
    }
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
    payload: { reason: string },
    file: UploadedJustificationFile | undefined,
    actorId: number,
    context: AuditContext = {},
  ) {
    const reason = payload.reason?.trim() ?? '';
    if (!reason || reason.length < 20) {
      throw new BadRequestException(
        'The justification reason must be complete and at least 20 characters long.',
      );
    }

    if (file) {
      const validMime = allowedEvidenceMimeTypes.has(
        file.mimetype.toLowerCase(),
      );
      const validExtension = allowedEvidenceExtensions.has(
        extname(file.originalname).toLowerCase(),
      );
      const validSize = file.size > 0 && file.size <= 5 * 1024 * 1024;
      if (!validMime || !validExtension || !validSize) {
        throw new BadRequestException(
          'The attachment is invalid. Allowed formats: PDF, JPG, JPEG, PNG; maximum size 5 MB.',
        );
      }
    }

    const [assembly, affiliate, attendance, existing] = await Promise.all([
      this.prisma.assembly.findUnique({
        where: { id: assemblyId },
        select: {
          id: true,
          status: true,
          convocations: { where: { affiliateId }, select: { id: true } },
        },
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
    if (assembly.status !== 'COMPLETED')
      throw new ConflictException('Only a completed assembly can be justified');
    if (!affiliate) throw new NotFoundException('Affiliate not found');
    if (assembly.convocations.length === 0)
      throw new ConflictException(
        'Only a convoked person can justify an absence',
      );
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

    let storedFileName: string | undefined;
    try {
      if (file) {
        await mkdir(evidenceDirectory, { recursive: true });
        storedFileName = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
        await writeFile(join(evidenceDirectory, storedFileName), file.buffer, {
          flag: 'wx',
        });
      }

      const item = await this.prisma.absenceJustification.create({
        data: {
          assemblyId,
          affiliateId,
          reason,
          status: 'PENDING',
          attachmentOriginalName: file?.originalname,
          attachmentMimeType: file?.mimetype,
          attachmentSize: file?.size,
          attachmentUrl: storedFileName,
        },
        select,
      });

      await this.audit?.log({
        userId: actorId,
        action: AuditAction.JUSTIFICATION_CREATED,
        module: 'ABSENCE_JUSTIFICATIONS',
        entityType: 'AbsenceJustification',
        entityId: item.id,
        details: { assemblyId, affiliateId, hasAttachment: Boolean(file) },
        ...context,
      });

      return item;
    } catch (error) {
      if (storedFileName) {
        await unlink(join(evidenceDirectory, storedFileName)).catch(
          () => undefined,
        );
      }
      throw error;
    }
  }

  private async affiliateIdForUser(actorId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { person: { select: { affiliate: { select: { id: true } } } } },
    });
    const affiliateId = user?.person?.affiliate?.id;
    if (!affiliateId)
      throw new ForbiddenException('No affiliate is linked to this account');
    return affiliateId;
  }

  async registerMine(
    payload: { assemblyId: number; reason: string },
    file: UploadedJustificationFile | undefined,
    actorId: number,
    context: AuditContext = {},
  ) {
    const affiliateId = await this.affiliateIdForUser(actorId);
    return this.registerFromAffiliate(
      payload.assemblyId,
      affiliateId,
      payload,
      file,
      actorId,
      context,
    );
  }

  async findMine(q: QueryJustificationsDto, actorId: number) {
    const affiliateId = await this.affiliateIdForUser(actorId);
    return this.findAll({ ...q, affiliateId });
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

  async getEvidenceFile(id: number, actor: { id: number; role: string }) {
    const item = await this.getEvidence(id, actor);
    if (!item.attachmentUrl) {
      throw new NotFoundException('Evidence file not found');
    }

    const fileName = item.attachmentUrl.replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = join(evidenceDirectory, fileName);
    await access(filePath).catch(() => {
      throw new NotFoundException('Evidence file not found');
    });

    return {
      stream: createReadStream(filePath),
      mimeType: item.attachmentMimeType ?? 'application/octet-stream',
      fileName: item.attachmentOriginalName ?? fileName,
    };
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
          rejectionReason:
            status === JustificationStatus.REJECTED ? note || null : null,
          reviewedAt: new Date(),
          reviewedById: actorId,
        },
      });
      if (claimed.count !== 1)
        throw new ConflictException('Justification has already been resolved');

      if (status === JustificationStatus.APPROVED) {
        const attendance = await tx.assemblyAttendance.findUnique({
          where: {
            assemblyId_affiliateId: {
              assemblyId: item.assemblyId,
              affiliateId: item.affiliateId,
            },
          },
          select: { status: true },
        });
        if (attendance?.status !== 'ABSENT') {
          throw new ConflictException(
            'The attendance record must remain absent before approving the justification.',
          );
        }
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
