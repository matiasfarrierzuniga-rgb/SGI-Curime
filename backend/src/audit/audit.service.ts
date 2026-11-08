import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from './audit-actions';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

export interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
}
export interface AuditEvent extends AuditContext {
  userId?: number;
  action: string;
  module: string;
  entityType?: string;
  entityId?: string | number;
  details?: unknown;
}
export interface BoardPrivilegeReview {
  id: number;
  createdAt: Date;
  trigger: string | null;
  membership: {
    id: number;
    position: string;
    startsOn: Date | null;
    endsOn: Date | null;
    term: { id: number; startsOn: Date; endsOn: Date; status: string | null };
  } | null;
  person: { id: number; fullName: string } | null;
  account: {
    id: number;
    fullName: string;
    email: string;
    status: string;
    role: { id: number; name: string };
    effectiveCapabilities: string[];
  } | null;
  resolution: {
    id: number;
    createdAt: Date;
    actor: { id: number; fullName: string; email: string } | null;
    decision: string | null;
    justification: string | null;
    roleChange: { previousRoleId: number; newRoleId: number } | null;
  } | null;
}
type AuditLogClient = Pick<PrismaService, 'auditLog'>;
const sensitive = /password|token|jwt|secret|database_url|admin_password/i;

export function sanitizeAuditDetails(
  value: unknown,
): Prisma.InputJsonValue | undefined {
  const ancestors = new WeakSet<object>();

  const sanitize = (item: unknown): Prisma.InputJsonValue | undefined => {
    if (item === undefined || item === null) return undefined;
    if (typeof item === 'string' || typeof item === 'boolean') return item;
    if (typeof item === 'number')
      return Number.isFinite(item) ? item : undefined;
    if (typeof item === 'bigint') return item.toString();
    if (typeof item !== 'object') return undefined;
    if (item instanceof Date)
      return Number.isNaN(item.getTime()) ? undefined : item.toISOString();
    if (ancestors.has(item)) return undefined;

    ancestors.add(item);
    try {
      if (Array.isArray(item))
        return item.map((entry) => sanitize(entry) ?? null);

      return Object.fromEntries(
        Object.entries(item)
          .filter(([key]) => !sensitive.test(key))
          .map(([key, entry]) => [key, sanitize(entry) ?? null]),
      );
    } finally {
      ancestors.delete(item);
    }
  };

  return sanitize(value);
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  log(event: AuditEvent, client: AuditLogClient = this.prisma) {
    return client.auditLog.create({
      data: {
        ...event,
        entityId: event.entityId?.toString(),
        details: sanitizeAuditDetails(event.details),
      },
    });
  }
  async findAll(query: QueryAuditLogsDto) {
    const where: Prisma.AuditLogWhereInput = {
      userId: query.userId,
      action: query.action,
      module: query.module,
      createdAt:
        query.dateFrom || query.dateTo
          ? {
              gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
              lte: query.dateTo ? new Date(query.dateTo) : undefined,
            }
          : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }
  async findOne(id: number) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
    if (!log) throw new NotFoundException('Audit log not found');
    return log;
  }

  async findBoardPrivilegeReviews(page = 1, limit = 20) {
    const where = { action: AuditAction.BOARD_PRIVILEGE_REVIEW_REQUIRED };
    const [reviews, total, resolutions] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where: { action: AuditAction.BOARD_PRIVILEGE_REVIEW_RESOLVED },
        select: {
          id: true,
          createdAt: true,
          details: true,
          user: { select: { id: true, fullName: true, email: true } },
        },
      }),
    ]);
    return {
      data: await Promise.all(
        reviews.map((review) => this.toBoardPrivilegeReview(review, resolutions)),
      ),
      total,
      page,
      limit,
    };
  }

  async findBoardPrivilegeReview(id: number) {
    const review = await this.prisma.auditLog.findFirst({
      where: { id, action: AuditAction.BOARD_PRIVILEGE_REVIEW_REQUIRED },
    });
    if (!review) throw new NotFoundException('Revisión de privilegios no encontrada');
    const resolutions = await this.prisma.auditLog.findMany({
      where: { action: AuditAction.BOARD_PRIVILEGE_REVIEW_RESOLVED },
      select: {
        id: true,
        createdAt: true,
        details: true,
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
    return this.toBoardPrivilegeReview(review, resolutions);
  }

  async recordBoardPrivilegeReviewResolution(
    reviewId: number,
    actorId: number,
    decision: 'NO_CHANGE' | 'ROLE_CHANGED',
    justification: string,
    roleChange: { previousRoleId: number; newRoleId: number } | null,
    context: AuditContext,
  ) {
    const existing = await this.prisma.auditLog.findFirst({
      where: {
        action: AuditAction.BOARD_PRIVILEGE_REVIEW_RESOLVED,
        details: { path: ['reviewId'], equals: reviewId },
      },
      select: { id: true },
    });
    if (existing)
      throw new ConflictException('La revisión de privilegios ya fue resuelta');
    return this.log({
      userId: actorId,
      action: AuditAction.BOARD_PRIVILEGE_REVIEW_RESOLVED,
      module: 'INSTITUTIONAL_BOARD',
      entityType: 'AuditLog',
      entityId: reviewId,
      details: { reviewId, decision, justification, roleChange, status: 'RESOLVED' },
      ...context,
    });
  }

  private async toBoardPrivilegeReview(
    review: { id: number; createdAt: Date; details: Prisma.JsonValue | null },
    resolutions: Array<{
      id: number;
      createdAt: Date;
      details: Prisma.JsonValue | null;
      user: { id: number; fullName: string | null; email: string } | null;
    }>,
  ): Promise<BoardPrivilegeReview> {
    const details = this.detailsRecord(review.details);
    const membershipId = this.detailsNumber(details, 'membershipId');
    const personId = this.detailsNumber(details, 'personId');
    const membership = membershipId
      ? await this.prisma.governanceMembership.findUnique({
          where: { id: membershipId },
          select: {
            id: true,
            legacyPosition: true,
            startedAt: true,
            endedAt: true,
            term: { select: { id: true, startDate: true, endDate: true, status: true } },
          },
        })
      : null;
    const person = personId
      ? await this.prisma.person.findUnique({
          where: { id: personId },
          select: { id: true, firstName: true, firstSurname: true, secondSurname: true, legacyFullName: true },
        })
      : null;
    const account = personId
      ? await this.prisma.user.findUnique({
          where: { personId },
          select: {
            id: true,
            fullName: true,
            email: true,
            status: true,
            role: {
              select: {
                id: true,
                name: true,
                permissions: { select: { permission: { select: { code: true } } } },
              },
            },
          },
        })
      : null;
    const resolution = resolutions.find(
      (entry) => this.detailsNumber(this.detailsRecord(entry.details), 'reviewId') === review.id,
    );
    const resolutionDetails = resolution ? this.detailsRecord(resolution.details) : null;
    const roleChangeValue = resolutionDetails?.roleChange;
    const roleChange = this.detailsRecord(roleChangeValue);
    return {
      id: review.id,
      createdAt: review.createdAt,
      trigger: typeof details.trigger === 'string' ? details.trigger : null,
      membership: membership
        ? {
            id: membership.id,
            position: membership.legacyPosition,
            startsOn: membership.startedAt,
            endsOn: membership.endedAt,
            term: {
              id: membership.term.id,
              startsOn: membership.term.startDate,
              endsOn: membership.term.endDate,
              status: membership.term.status,
            },
          }
        : null,
      person: person
        ? {
            id: person.id,
            fullName:
              [person.firstName, person.firstSurname, person.secondSurname]
                .filter(Boolean)
                .join(' ') || person.legacyFullName || `Persona ${person.id}`,
          }
        : null,
      account: account
        ? {
            id: account.id,
            fullName: account.fullName ?? account.email,
            email: account.email,
            status: account.status,
            role: { id: account.role.id, name: account.role.name },
            effectiveCapabilities: account.role.permissions.map(
              (assignment) => assignment.permission.code,
            ),
          }
        : null,
      resolution: resolution
        ? {
            id: resolution.id,
            createdAt: resolution.createdAt,
            actor: resolution.user
              ? {
                  id: resolution.user.id,
                  fullName: resolution.user.fullName ?? resolution.user.email,
                  email: resolution.user.email,
                }
              : null,
            decision:
              typeof resolutionDetails?.decision === 'string'
                ? resolutionDetails.decision
                : null,
            justification:
              typeof resolutionDetails?.justification === 'string'
                ? resolutionDetails.justification
                : null,
            roleChange:
              roleChange &&
              typeof roleChange.previousRoleId === 'number' &&
              typeof roleChange.newRoleId === 'number'
                ? {
                    previousRoleId: roleChange.previousRoleId,
                    newRoleId: roleChange.newRoleId,
                  }
                : null,
          }
        : null,
    };
  }

  private detailsRecord(value: unknown): Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private detailsNumber(details: Record<string, unknown>, key: string) {
    const value = details[key];
    return typeof value === 'number' && Number.isInteger(value) && value > 0
      ? value
      : null;
  }
}
