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
