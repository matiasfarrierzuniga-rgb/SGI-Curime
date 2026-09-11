import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssemblyQuorumType, Prisma } from '../../generated/prisma/client';
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
  quorumType: true,
  quorumValue: true,
  convocationsLockedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AssemblySelect;
const convocationSelect = {
  id: true,
  assemblyId: true,
  affiliateId: true,
  roleId: true,
  roleNameSnapshot: true,
  convenedAt: true,
  affiliate: { select: { id: true, fullName: true, status: true } },
} satisfies Prisma.AssemblyConvocationSelect;

export function calculateRequiredCount(
  convokedCount: number,
  quorumType: AssemblyQuorumType,
  quorumValue: number,
) {
  return quorumType === 'PERCENTAGE'
    ? Math.ceil((convokedCount * quorumValue) / 100)
    : quorumValue;
}

@Injectable()
export class AssembliesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private validateQuorum(type: AssemblyQuorumType, value: number) {
    if (!Number.isInteger(value) || value <= 0)
      throw new BadRequestException('Quorum value must be a positive integer');
    if (type === 'PERCENTAGE' && value > 100)
      throw new BadRequestException('Percentage quorum cannot exceed 100');
  }

  async create(
    dto: CreateAssemblyDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    this.validateQuorum(dto.quorumType, dto.quorumValue);
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.assembly.create({ data: dto, select });
      await this.audit.log(
        {
          userId: actorId,
          action: AuditAction.ASSEMBLY_CREATED,
          module: 'ASSEMBLIES',
          entityType: 'Assembly',
          entityId: item.id,
          details: {
            quorumType: item.quorumType,
            quorumValue: item.quorumValue,
          },
          ...context,
        },
        tx,
      );
      return item;
    });
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
        select: { ...select, _count: { select: { convocations: true } } },
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

  private async affiliateIdForUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { person: { select: { affiliate: { select: { id: true } } } } },
    });
    return user?.person?.affiliate?.id ?? null;
  }

  async findMine(userId: number) {
    const affiliateId = await this.affiliateIdForUser(userId);
    if (!affiliateId) return [];
    const items = await this.prisma.assemblyConvocation.findMany({
      where: { affiliateId },
      select: {
        ...convocationSelect,
        assembly: {
          select: {
            ...select,
            attendances: {
              where: { affiliateId },
              select: { status: true },
            },
            justifications: {
              where: { affiliateId },
              select: { id: true, status: true },
            },
          },
        },
      },
      orderBy: { assembly: { date: 'desc' } },
    });
    return items.map(({ assembly: item, ...convocation }) => ({
      ...convocation,
      assembly: {
        ...item,
        attendanceStatus: item.attendances[0]?.status ?? null,
        justification: item.justifications[0] ?? null,
        attendances: undefined,
        justifications: undefined,
      },
    }));
  }

  listEligibleAffiliates() {
    return this.prisma.affiliate.findMany({
      where: {
        status: 'ACTIVE',
        roleId: { not: null },
        role: { isActive: true },
      },
      select: {
        id: true,
        fullName: true,
        role: { select: { id: true, name: true } },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findOneAllowed(id: number, userId: number, role: string) {
    if (role === 'Administrador') return this.detail(id);
    const affiliateId = await this.affiliateIdForUser(userId);
    if (!affiliateId) throw new ForbiddenException('Assembly access denied');
    const own = await this.prisma.assemblyConvocation.findUnique({
      where: { assemblyId_affiliateId: { assemblyId: id, affiliateId } },
      select: { roleNameSnapshot: true },
    });
    if (!own) throw new ForbiddenException('Assembly access denied');
    const assembly = await this.findOne(id);
    return { ...assembly, roleNameSnapshot: own.roleNameSnapshot };
  }

  async detail(id: number) {
    const assembly = await this.findOne(id);
    const [convocations, quorum, attendance] = await Promise.all([
      this.getConvocations(id),
      this.getQuorum(id),
      this.getAttendance(id),
    ]);
    return { ...assembly, convocations, quorum, attendance };
  }

  async update(
    id: number,
    dto: UpdateAssemblyDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    const current = await this.findOne(id);
    if (current.status !== 'SCHEDULED' || current.convocationsLockedAt)
      throw new BadRequestException('Only a scheduled assembly can be edited');
    if (dto.status && dto.status !== 'SCHEDULED' && dto.status !== 'CANCELLED')
      throw new BadRequestException('Use the assembly lifecycle actions');
    const quorumType = dto.quorumType ?? current.quorumType;
    const quorumValue = dto.quorumValue ?? current.quorumValue;
    if (!quorumType || quorumValue === null)
      throw new BadRequestException('Quorum configuration is required');
    this.validateQuorum(quorumType, quorumValue);
    const count = await this.prisma.assemblyConvocation.count({
      where: { assemblyId: id },
    });
    if (quorumType === 'FIXED' && count > 0 && quorumValue > count)
      throw new BadRequestException(
        'Fixed quorum cannot exceed the number of convoked affiliates',
      );
    const locksNow = dto.status === 'CANCELLED';
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.assembly.update({
        where: { id },
        data: {
          ...dto,
          ...(locksNow ? { convocationsLockedAt: new Date() } : {}),
        },
        select,
      });
      await this.audit.log(
        {
          userId: actorId,
          action: AuditAction.ASSEMBLY_UPDATED,
          module: 'ASSEMBLIES',
          entityType: 'Assembly',
          entityId: id,
          details: {
            fields: Object.keys(dto),
            quorumChanged:
              dto.quorumType !== undefined || dto.quorumValue !== undefined,
          },
          ...context,
        },
        tx,
      );
      if (locksNow)
        await this.audit.log(
          {
            userId: actorId,
            action: AuditAction.ASSEMBLY_CONVOCATIONS_LOCKED,
            module: 'ASSEMBLIES',
            entityType: 'Assembly',
            entityId: id,
            ...context,
          },
          tx,
        );
      return item;
    });
  }

  async getConvocations(assemblyId: number) {
    await this.findOne(assemblyId);
    return this.prisma.assemblyConvocation.findMany({
      where: { assemblyId },
      select: convocationSelect,
      orderBy: { affiliate: { fullName: 'asc' } },
    });
  }

  async replaceConvocations(
    assemblyId: number,
    affiliateIds: number[],
    actorId: number,
    context: AuditContext = {},
  ) {
    const assembly = await this.findOne(assemblyId);
    if (assembly.convocationsLockedAt || assembly.status !== 'SCHEDULED')
      throw new BadRequestException(
        'Convocations are locked for this assembly',
      );
    if (new Set(affiliateIds).size !== affiliateIds.length)
      throw new BadRequestException('Duplicate affiliates are not allowed');
    const eligible = await this.prisma.affiliate.findMany({
      where: {
        id: { in: affiliateIds },
        status: 'ACTIVE',
        roleId: { not: null },
        role: { isActive: true },
      },
      select: { id: true, roleId: true, role: { select: { name: true } } },
    });
    if (eligible.length !== affiliateIds.length)
      throw new BadRequestException(
        'Every convoked affiliate must be active and have an active role',
      );
    if (
      assembly.quorumType === 'FIXED' &&
      assembly.quorumValue !== null &&
      affiliateIds.length > 0 &&
      assembly.quorumValue > affiliateIds.length
    )
      throw new BadRequestException(
        'Fixed quorum cannot exceed the number of convoked affiliates',
      );
    return this.prisma.$transaction(async (tx) => {
      await tx.assemblyConvocation.deleteMany({ where: { assemblyId } });
      if (eligible.length)
        await tx.assemblyConvocation.createMany({
          data: eligible.map((item) => ({
            assemblyId,
            affiliateId: item.id,
            roleId: item.roleId,
            roleNameSnapshot: item.role!.name,
          })),
        });
      await this.audit.log(
        {
          userId: actorId,
          action: AuditAction.ASSEMBLY_CONVOCATIONS_UPDATED,
          module: 'ASSEMBLIES',
          entityType: 'Assembly',
          entityId: assemblyId,
          details: { count: eligible.length },
          ...context,
        },
        tx,
      );
      return tx.assemblyConvocation.findMany({
        where: { assemblyId },
        select: convocationSelect,
        orderBy: { affiliate: { fullName: 'asc' } },
      });
    });
  }

  async lockConvocations(
    id: number,
    actorId: number,
    context: AuditContext = {},
  ) {
    const assembly = await this.findOne(id);
    if (assembly.convocationsLockedAt) return assembly;
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.assembly.update({
        where: { id },
        data: { convocationsLockedAt: new Date() },
        select,
      });
      await this.audit.log(
        {
          userId: actorId,
          action: AuditAction.ASSEMBLY_CONVOCATIONS_LOCKED,
          module: 'ASSEMBLIES',
          entityType: 'Assembly',
          entityId: id,
          ...context,
        },
        tx,
      );
      return item;
    });
  }

  async start(id: number, actorId: number, context: AuditContext = {}) {
    const assembly = await this.findOne(id);
    if (assembly.status !== 'SCHEDULED' || assembly.convocationsLockedAt)
      throw new BadRequestException('Only a scheduled assembly can be started');
    const count = await this.prisma.assemblyConvocation.count({
      where: { assemblyId: id },
    });
    if (count === 0)
      throw new BadRequestException(
        'At least one convoked person is required to start the assembly',
      );
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.assembly.update({
        where: { id },
        data: { status: 'IN_PROGRESS', convocationsLockedAt: new Date() },
        select,
      });
      await this.audit.log(
        {
          userId: actorId,
          action: AuditAction.ASSEMBLY_STARTED,
          module: 'ASSEMBLIES',
          entityType: 'Assembly',
          entityId: id,
          details: { convokedCount: count },
          ...context,
        },
        tx,
      );
      return item;
    });
  }

  async complete(id: number, actorId: number, context: AuditContext = {}) {
    const assembly = await this.findOne(id);
    if (assembly.status !== 'IN_PROGRESS')
      throw new BadRequestException(
        'Only an assembly in progress can be completed',
      );
    const [convokedCount, recordedCount] = await Promise.all([
      this.prisma.assemblyConvocation.count({ where: { assemblyId: id } }),
      this.prisma.assemblyAttendance.count({
        where: { assemblyId: id, status: { in: ['PRESENT', 'ABSENT'] } },
      }),
    ]);
    const missingCount = convokedCount - recordedCount;
    if (missingCount > 0)
      throw new BadRequestException(
        `${missingCount} attendance records are still missing`,
      );
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.assembly.update({
        where: { id },
        data: { status: 'COMPLETED' },
        select,
      });
      await this.audit.log(
        {
          userId: actorId,
          action: AuditAction.ASSEMBLY_COMPLETED,
          module: 'ASSEMBLIES',
          entityType: 'Assembly',
          entityId: id,
          details: { convokedCount },
          ...context,
        },
        tx,
      );
      return item;
    });
  }

  async remove(id: number, actorId: number, context: AuditContext = {}) {
    const assembly = await this.findOne(id);
    if (assembly.status !== 'SCHEDULED' || assembly.convocationsLockedAt)
      throw new BadRequestException(
        'This assembly has started or contains historical records and cannot be deleted',
      );
    return this.prisma.$transaction(
      async (tx) => {
        const [attendanceCount, justificationCount] = await Promise.all([
          tx.assemblyAttendance.count({ where: { assemblyId: id } }),
          tx.absenceJustification.count({ where: { assemblyId: id } }),
        ]);
        if (attendanceCount > 0 || justificationCount > 0)
          throw new BadRequestException(
            'This assembly contains attendance or justification history and cannot be deleted',
          );
        const convokedCount = await tx.assemblyConvocation.count({
          where: { assemblyId: id },
        });
        await tx.assemblyConvocation.deleteMany({ where: { assemblyId: id } });
        await tx.assembly.delete({ where: { id } });
        await this.audit.log(
          {
            userId: actorId,
            action: AuditAction.ASSEMBLY_DELETED,
            module: 'ASSEMBLIES',
            entityType: 'Assembly',
            entityId: id,
            details: { convokedCount },
            ...context,
          },
          tx,
        );
        return { id, deleted: true };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async getQuorum(assemblyId: number) {
    const assembly = await this.findOne(assemblyId);
    const [convokedCount, presentCount] = await Promise.all([
      this.prisma.assemblyConvocation.count({ where: { assemblyId } }),
      this.prisma.assemblyAttendance.count({
        where: { assemblyId, status: 'PRESENT' },
      }),
    ]);
    if (
      !assembly.quorumType ||
      assembly.quorumValue === null ||
      convokedCount === 0
    )
      return {
        available: false,
        reason: 'Historical assembly has no reliable convocation denominator',
        convokedCount,
        presentCount,
        quorumType: assembly.quorumType,
        quorumValue: assembly.quorumValue,
        requiredCount: null,
        quorumReached: null,
      };
    const requiredCount = calculateRequiredCount(
      convokedCount,
      assembly.quorumType,
      assembly.quorumValue,
    );
    return {
      available: true,
      convokedCount,
      presentCount,
      quorumType: assembly.quorumType,
      quorumValue: assembly.quorumValue,
      requiredCount,
      quorumReached: presentCount >= requiredCount,
    };
  }

  async recordAttendance(
    assemblyId: number,
    dto: RecordAttendanceDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    const assembly = await this.findOne(assemblyId);
    if (assembly.status !== 'IN_PROGRESS')
      throw new BadRequestException(
        'Attendance can only be recorded while the assembly is in progress',
      );
    const ids = dto.entries.map((entry) => entry.affiliateId);
    if (new Set(ids).size !== ids.length)
      throw new BadRequestException(
        'Duplicate affiliates in attendance payload',
      );
    if (
      dto.entries.some((entry) => !['PRESENT', 'ABSENT'].includes(entry.status))
    )
      throw new BadRequestException(
        'Attendance status must be PRESENT or ABSENT',
      );
    const convoked = await this.prisma.assemblyConvocation.count({
      where: { assemblyId, affiliateId: { in: ids } },
    });
    if (convoked !== ids.length)
      throw new BadRequestException(
        'Every attendance entry must reference a convoked person',
      );
    await this.prisma.$transaction(
      dto.entries.map((entry) =>
        this.prisma.assemblyAttendance.upsert({
          where: {
            assemblyId_affiliateId: {
              assemblyId,
              affiliateId: entry.affiliateId,
            },
          },
          create: { assemblyId, ...entry },
          update: {
            status: entry.status,
            observations: entry.observations,
            registeredAt: new Date(),
          },
        }),
      ),
    );
    await this.audit.log({
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
    const [convocations, records, present, absent, justified] =
      await this.prisma.$transaction([
        this.prisma.assemblyConvocation.findMany({
          where: { assemblyId },
          select: convocationSelect,
          orderBy: { affiliate: { fullName: 'asc' } },
        }),
        this.prisma.assemblyAttendance.findMany({
          where: { assemblyId },
          select: {
            id: true,
            affiliateId: true,
            status: true,
            observations: true,
            registeredAt: true,
          },
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
    const byAffiliate = new Map(
      records.map((record) => [record.affiliateId, record]),
    );
    const data = convocations.map((convocation) => ({
      ...convocation,
      attendance: byAffiliate.get(convocation.affiliateId) ?? null,
    }));
    const quorum = await this.getQuorum(assemblyId);
    return {
      assemblyId,
      present,
      absent,
      justified,
      unrecorded: Math.max(
        0,
        quorum.convokedCount - present - absent - justified,
      ),
      attendancePercentage:
        quorum.convokedCount === 0
          ? null
          : Number(((present / quorum.convokedCount) * 100).toFixed(2)),
      data,
      quorum,
    };
  }
}
