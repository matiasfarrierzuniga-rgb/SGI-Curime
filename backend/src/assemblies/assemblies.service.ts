import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssemblyDto, UpdateAssemblyDto } from './dto/assembly.dto';
import { QueryAssembliesDto } from './dto/query-assemblies.dto';
import { RecordAttendanceDto } from './dto/record-attendance.dto';
const select = {
  id: true,
  title: true,
  type: true,
  date: true,
  place: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AssemblySelect;
@Injectable()
export class AssembliesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly audit?: AuditService,
  ) {}
  async create(
    dto: CreateAssemblyDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    const item = await this.prisma.assembly.create({ data: dto, select });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.ASSEMBLY_CREATED,
      module: 'ASSEMBLIES',
      entityType: 'Assembly',
      entityId: item.id,
      ...context,
    });
    return item;
  }
  async findAll(q: QueryAssembliesDto) {
    const where: Prisma.AssemblyWhereInput = {
      status: q.status,
      date:
        q.dateFrom || q.dateTo ? { gte: q.dateFrom, lte: q.dateTo } : undefined,
      OR: q.search
        ? [
            { title: { contains: q.search, mode: 'insensitive' } },
            { place: { contains: q.search, mode: 'insensitive' } },
            { type: { contains: q.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.assembly.findMany({
        where,
        select,
        orderBy: { date: 'desc' },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      this.prisma.assembly.count({ where }),
    ]);
    return { data, total, page: q.page, limit: q.limit };
  }
  async findOne(id: number) {
    const item = await this.prisma.assembly.findUnique({
      where: { id },
      select,
    });
    if (!item) throw new NotFoundException('Assembly not found');
    return item;
  }
  async update(
    id: number,
    dto: UpdateAssemblyDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    await this.findOne(id);
    const item = await this.prisma.assembly.update({
      where: { id },
      data: dto,
      select,
    });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.ASSEMBLY_UPDATED,
      module: 'ASSEMBLIES',
      entityType: 'Assembly',
      entityId: id,
      details: { fields: Object.keys(dto) },
      ...context,
    });
    return item;
  }
  async recordAttendance(
    assemblyId: number,
    dto: RecordAttendanceDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    await this.findOne(assemblyId);
    const ids = dto.entries.map((e) => e.affiliateId);
    if (new Set(ids).size !== ids.length)
      throw new BadRequestException(
        'Duplicate affiliates in attendance payload',
      );
    const active = await this.prisma.affiliate.count({
      where: { id: { in: ids }, status: 'ACTIVE' },
    });
    if (active !== ids.length)
      throw new BadRequestException(
        'Every attendance entry must reference an active affiliate',
      );
    await this.prisma.$transaction(
      dto.entries.map((e) =>
        this.prisma.assemblyAttendance.upsert({
          where: {
            assemblyId_affiliateId: { assemblyId, affiliateId: e.affiliateId },
          },
          create: { assemblyId, ...e },
          update: {
            status: e.status,
            observations: e.observations,
            registeredAt: new Date(),
          },
        }),
      ),
    );
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.ATTENDANCE_RECORDED,
      module: 'ASSEMBLIES',
      entityType: 'Assembly',
      entityId: assemblyId,
      details: { entries: dto.entries.length },
      ...context,
    });
    return this.getAttendance(assemblyId);
  }
  async getAttendance(assemblyId: number) {
    await this.findOne(assemblyId);
    const [totalActive, data, present, absent, justified] =
      await this.prisma.$transaction([
        this.prisma.affiliate.count({ where: { status: 'ACTIVE' } }),
        this.prisma.assemblyAttendance.findMany({
          where: { assemblyId },
          include: {
            affiliate: {
              select: {
                id: true,
                fullName: true,
                identification: true,
                status: true,
              },
            },
          },
          orderBy: { affiliate: { fullName: 'asc' } },
        }),
        this.prisma.assemblyAttendance.count({
          where: { assemblyId, status: 'PRESENT' },
        }),
        this.prisma.assemblyAttendance.count({
          where: { assemblyId, status: 'ABSENT' },
        }),
        this.prisma.assemblyAttendance.count({
          where: { assemblyId, status: 'JUSTIFIED' },
        }),
      ]);
    return {
      assemblyId,
      totalActive,
      present,
      absent,
      justified,
      unrecorded: Math.max(0, totalActive - present - absent - justified),
      attendancePercentage:
        totalActive === 0
          ? 0
          : Number(((present / totalActive) * 100).toFixed(2)),
      data,
    };
  }
}
