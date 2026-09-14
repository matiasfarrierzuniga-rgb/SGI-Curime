import { useQuery } from '@tanstack/react-query'
import { adminDashboardApi } from '../api/adminDashboard.api'

export const adminDashboardKeys = {
  all: ['admin-dashboard'] as const,
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminDashboardKeys.all,
    queryFn: adminDashboardApi.get,
  })
}
