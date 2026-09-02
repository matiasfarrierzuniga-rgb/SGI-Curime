import { Logger } from '@nestjs/common';

export const AUDIT_PORT = Symbol('AUDIT_PORT');

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

export interface AuditPort {
  record(event: AuditEvent): Promise<void>;
}

const auditLogger = new Logger('AuthAudit');

export async function recordAuditBestEffort(
  audit: AuditPort | undefined,
  event: AuditEvent,
): Promise<void> {
  if (!audit) return;
  try {
    await audit.record(event);
  } catch {
    auditLogger.error(`Failed to persist auth audit event: ${event.action}`);
  }
}
