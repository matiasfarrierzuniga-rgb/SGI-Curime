import { useQuery } from '@tanstack/react-query'
import { adminDashboardApi } from '../api/adminDashboard.api'

export const adminDashboardKeys = {
  all: ['admin-dashboard'] as const,
  recentActivity: () => [...adminDashboardKeys.all, 'recent-activity'] as const,
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminDashboardKeys.all,
    queryFn: adminDashboardApi.get,
  })
}

export function useRecentAdminActivity(enabled: boolean) {
  return useQuery({
    queryKey: adminDashboardKeys.recentActivity(),
    queryFn: adminDashboardApi.getRecentActivity,
    enabled,
    staleTime: 30_000,
  })
}
