export interface AuditUser { id: number; fullName: string; email: string }
export interface AuditLog { id: number; action: string; module: string; entityType: string | null; entityId: string | null; details: unknown; ipAddress: string | null; userAgent: string | null; createdAt: string; userId: number | null; user: AuditUser | null }
export interface AuditQuery { page?: number; limit?: number; userId?: number; action?: string; module?: string; dateFrom?: string; dateTo?: string }
export interface BoardPrivilegeReview {
  id: number
  createdAt: string
  trigger: string | null
  membership: { id: number; position: string; startsOn: string | null; endsOn: string | null; term: { id: number; startsOn: string; endsOn: string; status: string | null } } | null
  person: { id: number; fullName: string } | null
  account: { id: number; fullName: string; email: string; status: string; role: { id: number; name: string }; effectiveCapabilities: string[] } | null
  resolution: { id: number; createdAt: string; actor: AuditUser | null; decision: string | null; justification: string | null; roleChange: { previousRoleId: number; newRoleId: number } | null } | null
}
export interface BoardPrivilegeReviewResolution { decision: 'NO_CHANGE' | 'ROLE_CHANGED'; justification: string; roleId?: number }
