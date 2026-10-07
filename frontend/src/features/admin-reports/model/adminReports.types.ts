export type AffiliateStatus = 'ACTIVE' | 'INACTIVE'
export type SubscriptionReportStatus = 'CURRENT' | 'EXPIRED' | 'UNSPECIFIED'

export interface AffiliateReportFilters {
  search?: string
  affiliateType?: string
  affiliateStatus?: AffiliateStatus
  subscriptionStatus?: SubscriptionReportStatus
  dateFrom?: string
  dateTo?: string
  page: number
  limit: number
}

export interface AffiliateReportRow {
  id: number
  fullName: string
  identification: string
  affiliateType: string | null
  affiliationDate: string
  affiliateStatus: AffiliateStatus
  subscriptionExpirationDate: string | null
  subscriptionStatus: SubscriptionReportStatus
  daysRemaining: number | null
}

export type AdminReportDataSource =
  | 'AFFILIATE'
  | 'ASSEMBLY_CONVOCATION'
  | 'ABSENCE_JUSTIFICATION'
  | 'SANCTION'

export interface AdminReportMetadata {
  generatedAt: string
  generatedBy: { id: number; fullName: string } | null
  period: { from: string | null; to: string | null }
  appliedFilters: Record<string, string | number | boolean>
  dataSource: AdminReportDataSource
  reportVersion: string
}

export interface AffiliateReportResponse {
  metadata: AdminReportMetadata
  data: {
    data: AffiliateReportRow[]
    total: number
    page: number
    limit: number
  }
}

export interface AffiliatesSummaryResponse {
  metadata: AdminReportMetadata
  data: AffiliatesSummaryData
}

export interface AffiliateMembershipStatistics {
  total: number
  active: number
  expired: number
  expiringSoon: number
  withoutMembership: number
  expirationUnspecified: number
}

export interface AffiliateTypeDistribution {
  affiliateType: string | null
  count: number
}

export interface AffiliatesSummaryData {
  total: number
  active: number
  inactive: number
  pendingRequests: number
  memberships: AffiliateMembershipStatistics
  byAffiliateType: AffiliateTypeDistribution[]
}

export interface AttendanceSummaryFilters {
  dateFrom?: string
  dateTo?: string
  assemblyId?: number
}

export type AssemblyReportStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export interface AttendanceSummaryRow {
  id: number
  title: string
  date: string
  status: AssemblyReportStatus
  convokedCount: number
  denominatorAvailable: boolean
  present: number
  absent: number
  justified: number
  unrecorded: number
  attendancePercentage: number | null
}

export interface AttendanceSummaryResponse {
  metadata: AdminReportMetadata
  data: {
    assemblies: number
    totals: {
      present: number
      absent: number
      justified: number
    }
    data: AttendanceSummaryRow[]
  }
}

export interface JustificationsSummaryResponse {
  metadata: AdminReportMetadata
  data: {
    total: number
    PENDING: number
    APPROVED: number
    REJECTED: number
  }
}

export interface SanctionsSummaryResponse {
  metadata: AdminReportMetadata
  data: {
    total: number
    ACTIVE: number
    RESOLVED: number
    REVOKED: number
  }
}
