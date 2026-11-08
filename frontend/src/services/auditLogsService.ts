import { httpClient } from '@/shared/api/httpClient'
import type { PaginatedResponse } from '../types/api'
import type { AuditLog, AuditQuery, BoardPrivilegeReview, BoardPrivilegeReviewResolution } from '../types/audit'
export const auditLogsService = {
  async list(params: AuditQuery) { return (await httpClient.get<PaginatedResponse<AuditLog>>('/audit-logs', { params })).data },
  async get(id: number) { return (await httpClient.get<AuditLog>(`/audit-logs/${id}`)).data },
  async listBoardPrivilegeReviews(params: Pick<AuditQuery, 'page' | 'limit'>) { return (await httpClient.get<PaginatedResponse<BoardPrivilegeReview>>('/users/privilege-reviews', { params })).data },
  async resolveBoardPrivilegeReview(id: number, payload: BoardPrivilegeReviewResolution) { return (await httpClient.patch<BoardPrivilegeReview>(`/users/privilege-reviews/${id}/resolve`, payload)).data },
}
