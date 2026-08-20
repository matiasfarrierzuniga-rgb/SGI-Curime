import { httpClient } from '../api/httpClient'
import type { PaginatedResponse } from '../types/api'
import type { AuditLog, AuditQuery } from '../types/audit'
export const auditLogsService = { async list(params: AuditQuery) { return (await httpClient.get<PaginatedResponse<AuditLog>>('/audit-logs', { params })).data }, async get(id: number) { return (await httpClient.get<AuditLog>(`/audit-logs/${id}`)).data } }
