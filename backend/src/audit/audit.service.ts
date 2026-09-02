import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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
}
