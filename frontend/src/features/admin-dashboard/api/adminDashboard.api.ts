import { httpClient } from '@/shared/api/httpClient'
import type { PaginatedResponse } from '@/shared/api/api.types'
import type { AdminDashboardResponse, RecentAuditActivity } from '../model/adminDashboard.types'

export const adminDashboardApi = {
  async get() {
    return (await httpClient.get<AdminDashboardResponse>('/admin-reports/dashboard')).data
  },
  async getRecentActivity() {
    return (await httpClient.get<PaginatedResponse<RecentAuditActivity>>('/audit-logs', { params: { page: 1, limit: 20 } })).data
  },
}
