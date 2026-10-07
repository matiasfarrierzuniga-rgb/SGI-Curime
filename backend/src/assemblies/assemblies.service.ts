import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssemblyQuorumType,
  AssemblyType,
  Prisma,
} from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssemblyDto, UpdateAssemblyDto } from './dto/assembly.dto';
import { QueryAssembliesDto } from './dto/query-assemblies.dto';
import { RecordAttendanceDto } from './dto/record-attendance.dto';

const select = {
  id: true,
  title: true,
  legacyType: true,
  legacyDate: true,
  place: true,
  description: true,
  status: true,
  legacyQuorumType: true,
  legacyQuorumValue: true,
  convocationsLockedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AssemblySelect;
const convocationSelect = {
  id: true,
  assemblyId: true,
  affiliateId: true,
  legacyRoleId: true,
  legacyRoleNameSnapshot: true,
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
      const item = await tx.assembly.create({
        data: {
          title: dto.title,
          type: this.toAssemblyType(dto.type),
          legacyType: dto.type,
          legacyDate: dto.date,
          scheduledAt: dto.date,
          place: dto.place,
          description: dto.description,
          status: dto.status,
          legacyQuorumType: dto.quorumType,
          legacyQuorumValue: dto.quorumValue,
        },
        select,
      });
      await this.audit.log(
        {
          userId: actorId,
          action: AuditAction.ASSEMBLY_CREATED,
          module: 'ASSEMBLIES',
          entityType: 'Assembly',
          entityId: item.id,
          details: {
            quorumType: item.legacyQuorumType,
            quorumValue: item.legacyQuorumValue,
          },
          ...context,
        },
        tx,
      );
      return this.serializeAssembly(item);
    });
  }

  async findAll(q: QueryAssembliesDto) {
    const where: Prisma.AssemblyWhereInput = {
      status: q.status,
      legacyType: q.type,
      legacyDate:
        q.dateFrom || q.dateTo ? { gte: q.dateFrom, lte: q.dateTo } : undefined,
      OR: q.search
        ? [
            { title: { contains: q.search, mode: 'insensitive' } },
            { place: { contains: q.search, mode: 'insensitive' } },
            { legacyType: { contains: q.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [[data, total], [statusGroups, typeGroups]] = await Promise.all([
      this.prisma.$transaction([
        this.prisma.assembly.findMany({
          where,
          select: { ...select, _count: { select: { convocations: true } } },
          orderBy: { legacyDate: 'desc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
        }),
        this.prisma.assembly.count({ where }),
      ]),
      Promise.all([
        this.prisma.assembly.groupBy({
          by: ['status'],
          where,
          orderBy: { status: 'asc' },
          _count: { _all: true },
        }),
        this.prisma.assembly.groupBy({
          by: ['legacyType'],
          where,
          orderBy: { legacyType: 'asc' },
          _count: { _all: true },
        }),
      ]),
    ])
    return {
      data: data.map((item) => this.serializeAssembly(item)),
      total,
      page: q.page,
      limit: q.limit,
      byStatus: statusGroups.map(({ status, _count }) => ({
        status,
        count: _count._all,
      })),
      byType: typeGroups.map(({ legacyType, _count }) => ({
        type: legacyType,
        count: _count._all,
      })),
    };
  }

  async findOne(id: number) {
    const item = await this.prisma.assembly.findUnique({
      where: { id },
      select,
    });
    if (!item) throw new NotFoundException('Assembly not found');
    return this.serializeAssembly(item);
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
          },
        },
        attendance: {
          select: {
            status: true,
            justification: { select: { id: true, status: true } },
          },
        },
      },
      orderBy: { assembly: { legacyDate: 'desc' } },
    });
    return items.map(({ assembly: item, attendance, ...convocation }) => ({
      ...this.serializeConvocation(convocation),
      assembly: {
        ...this.serializeAssembly(item),
        attendanceStatus: attendance?.status ?? null,
        justification: attendance?.justification ?? null,
      },
    }));
  }

  async listEligibleAffiliates() {
    const affiliates = await this.prisma.affiliate.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        fullName: true,
      },
      orderBy: { fullName: 'asc' },
    });
    return affiliates;
  }

  async findOneAllowed(id: number, userId: number, role: string) {
    if (role === 'Administrador') return this.detail(id);
    const affiliateId = await this.affiliateIdForUser(userId);
    if (!affiliateId) throw new ForbiddenException('Assembly access denied');
    const own = await this.prisma.assemblyConvocation.findUnique({
      where: { assemblyId_affiliateId: { assemblyId: id, affiliateId } },
      select: { legacyRoleNameSnapshot: true },
    });
    if (!own) throw new ForbiddenException('Assembly access denied');
    const assembly = await this.findOne(id);
    return {
      ...assembly,
      roleNameSnapshot: own.legacyRoleNameSnapshot,
    };
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
          title: dto.title,
          type:
            dto.type === undefined ? undefined : this.toAssemblyType(dto.type),
          legacyType: dto.type,
          legacyDate: dto.date,
          scheduledAt: dto.date,
          place: dto.place,
          description: dto.description,
          status: dto.status,
          legacyQuorumType: dto.quorumType,
          legacyQuorumValue: dto.quorumValue,
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
      return this.serializeAssembly(item);
    });
  }

  async getConvocations(assemblyId: number) {
    await this.findOne(assemblyId);
    const items = await this.prisma.assemblyConvocation.findMany({
      where: { assemblyId },
      select: convocationSelect,
      orderBy: { affiliate: { fullName: 'asc' } },
    });
    return items.map((item) => this.serializeConvocation(item));
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
      },
      select: { id: true, legacyRoleId: true },
    });
    // legacyRoleId is optional historical metadata; active affiliates remain eligible
    // without it and receive an empty role-name snapshot.
    const legacyRoleIds = eligible.flatMap((item) =>
      item.legacyRoleId === null ? [] : [item.legacyRoleId],
    );
    const roles = legacyRoleIds.length
      ? await this.prisma.role.findMany({
          where: { id: { in: legacyRoleIds } },
          select: { id: true, name: true },
        })
      : [];
    const roleById = new Map(roles.map((role) => [role.id, role]));
    if (
      eligible.length !== affiliateIds.length
    )
      throw new BadRequestException(
        'Every convoked affiliate must be active',
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
            legacyRoleId: item.legacyRoleId,
            legacyRoleNameSnapshot:
              roleById.get(item.legacyRoleId ?? -1)?.name ?? '',
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
      const items = await tx.assemblyConvocation.findMany({
        where: { assemblyId },
        select: convocationSelect,
        orderBy: { affiliate: { fullName: 'asc' } },
      });
      return items.map((item) => this.serializeConvocation(item));
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
      return this.serializeAssembly(item);
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
      return this.serializeAssembly(item);
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
        where: { legacyAssemblyId: id, status: { in: ['PRESENT', 'ABSENT'] } },
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
      return this.serializeAssembly(item);
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
          tx.assemblyAttendance.count({ where: { legacyAssemblyId: id } }),
          tx.absenceJustification.count({ where: { legacyAssemblyId: id } }),
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
        where: { legacyAssemblyId: assemblyId, status: 'PRESENT' },
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
    const convocations = await this.prisma.assemblyConvocation.findMany({
      where: { assemblyId, affiliateId: { in: ids } },
      select: { id: true, affiliateId: true },
    });
    if (convocations.length !== ids.length)
      throw new BadRequestException(
        'Every attendance entry must reference a convoked person',
      );
    const convocationByAffiliate = new Map(
      convocations.map((item) => [item.affiliateId, item.id]),
    );
    await this.prisma.$transaction(
      dto.entries.map((entry) =>
        this.prisma.assemblyAttendance.upsert({
          where: {
            legacyAssemblyId_legacyAffiliateId: {
              legacyAssemblyId: assemblyId,
              legacyAffiliateId: entry.affiliateId,
            },
          },
          create: {
            legacyAssemblyId: assemblyId,
            legacyAffiliateId: entry.affiliateId,
            convocationId: convocationByAffiliate.get(entry.affiliateId)!,
            status: entry.status,
            observations: entry.observations,
          },
          update: {
            status: entry.status,
            convocationId: convocationByAffiliate.get(entry.affiliateId)!,
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
          where: { legacyAssemblyId: assemblyId },
          select: {
            id: true,
            legacyAffiliateId: true,
            status: true,
            observations: true,
            registeredAt: true,
          },
        }),
        this.prisma.assemblyAttendance.count({
          where: { legacyAssemblyId: assemblyId, status: 'PRESENT' },
        }),
        this.prisma.assemblyAttendance.count({
          where: { legacyAssemblyId: assemblyId, status: 'ABSENT' },
        }),
        this.prisma.assemblyAttendance.count({
          where: { legacyAssemblyId: assemblyId, status: 'JUSTIFIED' },
        }),
      ]);
    const byAffiliate = new Map(
      records.map(({ legacyAffiliateId, ...record }) => [
        legacyAffiliateId,
        { ...record, affiliateId: legacyAffiliateId },
      ]),
    );
    const data = convocations.map((convocation) => ({
      ...this.serializeConvocation(convocation),
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

  private serializeAssembly<T extends {
    legacyType: string | null;
    legacyDate: Date;
    legacyQuorumType: AssemblyQuorumType | null;
    legacyQuorumValue: number | null;
  }>(item: T) {
    const {
      legacyType,
      legacyDate,
      legacyQuorumType,
      legacyQuorumValue,
      ...rest
    } = item;
    return {
      ...rest,
      type: legacyType,
      date: legacyDate,
      quorumType: legacyQuorumType,
      quorumValue: legacyQuorumValue,
    };
  }

  private serializeConvocation<T extends {
    legacyRoleId: number | null;
    legacyRoleNameSnapshot: string;
  }>(item: T) {
    const { legacyRoleId, legacyRoleNameSnapshot, ...rest } = item;
    return {
      ...rest,
      roleId: legacyRoleId,
      roleNameSnapshot: legacyRoleNameSnapshot,
    };
  }

  private toAssemblyType(value: string | undefined): AssemblyType | null {
    return value === AssemblyType.ORDINARY ||
      value === AssemblyType.EXTRAORDINARY
      ? value
      : null;
  }
}
