export type AdminDashboardData = {
  affiliates: { total: number; active: number; inactive: number }
  affiliateRequests: { pending: number }
  reservations: {
    total: number
    pending: number
    approved: number
    rejected: number
    cancelled: number
    confirmed: number
    completed: number
  }
  financial: {
    currency: string
    totalIncome: string
    totalExpenses: string
    balance: string
  }
  donations: { total: number; confirmed: number; cancelled: number }
  inventory: {
    totalItems: number
    lowStockItems: number
    outOfStockItems: number
    activeLoans: number
    overdueLoans: number
  }
  assemblies: {
    total: number
    scheduled: number
    in_progress: number
    completed: number
    cancelled: number
  }
  justifications: { pending: number }
}

export type AdminDashboardResponse = {
  metadata: {
    generatedAt: string
    generatedBy: { id: number; fullName: string } | null
    period: { from: string | null; to: string | null }
    appliedFilters: Record<string, string | number | boolean>
    dataSource: string | string[]
    reportVersion: string
  }
  data: AdminDashboardData
}
