export interface AuditUser { id: number; fullName: string; email: string }
export interface AuditLog { id: number; action: string; module: string; entityType: string | null; entityId: string | null; details: unknown; ipAddress: string | null; userAgent: string | null; createdAt: string; userId: number | null; user: AuditUser | null }
export interface AuditQuery { page?: number; limit?: number; userId?: number; action?: string; module?: string; dateFrom?: string; dateTo?: string }
