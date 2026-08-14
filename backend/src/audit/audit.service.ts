import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

export interface AuditContext { ipAddress?: string; userAgent?: string }
export interface AuditEvent extends AuditContext { userId?: number; action: string; module: string; entityType?: string; entityId?: string | number; details?: unknown }
const sensitive = /password|token|jwt|secret|database_url|admin_password/i;

export function sanitizeAuditDetails(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  if (value === null) return undefined;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map((item) => sanitizeAuditDetails(item) ?? null);
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !sensitive.test(key)).map(([key, item]) => [key, sanitizeAuditDetails(item) ?? null]));
  return String(value);
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  log(event: AuditEvent) {
    return this.prisma.auditLog.create({ data: { ...event, entityId: event.entityId?.toString(), details: sanitizeAuditDetails(event.details) } });
  }
  async findAll(query: QueryAuditLogsDto) {
    const where: Prisma.AuditLogWhereInput = { userId: query.userId, action: query.action, module: query.module, createdAt: query.dateFrom || query.dateTo ? { gte: query.dateFrom ? new Date(query.dateFrom) : undefined, lte: query.dateTo ? new Date(query.dateTo) : undefined } : undefined };
    const [data, total] = await this.prisma.$transaction([this.prisma.auditLog.findMany({ where, include: { user: { select: { id: true, fullName: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.limit, take: query.limit }), this.prisma.auditLog.count({ where })]);
    return { data, total, page: query.page, limit: query.limit };
  }
  async findOne(id: number) {
    const log = await this.prisma.auditLog.findUnique({ where: { id }, include: { user: { select: { id: true, fullName: true, email: true } } } });
    if (!log) throw new NotFoundException('Audit log not found');
    return log;
  }
}
