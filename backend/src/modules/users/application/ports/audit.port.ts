export interface AuditEvent {
  userId?: number;
  action: string;
  module: string;
  entityType?: string;
  entityId?: string | number;
  details?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditPort {
  record(event: AuditEvent): Promise<void>;
}
