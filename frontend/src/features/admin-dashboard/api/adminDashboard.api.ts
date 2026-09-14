import { httpClient } from '@/shared/api/httpClient'
import type { AdminDashboardResponse } from '../model/adminDashboard.types'

export const adminDashboardApi = {
  async get() {
    return (await httpClient.get<AdminDashboardResponse>('/admin-reports/dashboard')).data
  },
}
