import { httpClient } from '@/shared/api/httpClient'
import type {
  AffiliateReportFilters,
  AffiliateReportResponse,
  AffiliatesSummaryResponse,
  AttendanceSummaryFilters,
  AttendanceSummaryResponse,
  JustificationsSummaryResponse,
  SanctionsSummaryResponse,
} from '../model/adminReports.types'

export const adminReportsApi = {
  async getAffiliatesSummary() {
    return (
      await httpClient.get<AffiliatesSummaryResponse>(
        '/admin-reports/affiliates-summary',
      )
    ).data
  },
  async getAffiliates(filters: AffiliateReportFilters) {
    return (
      await httpClient.get<AffiliateReportResponse>('/admin-reports/affiliates', {
        params: filters,
      })
    ).data
  },
  async exportAffiliates(filters: AffiliateReportFilters) {
    return (
      await httpClient.get<Blob>('/admin-reports/affiliates/export', {
        params: {
          search: filters.search,
          affiliateType: filters.affiliateType,
          affiliateStatus: filters.affiliateStatus,
          subscriptionStatus: filters.subscriptionStatus,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        },
        responseType: 'blob',
      })
    ).data
  },
  async getAttendanceSummary(filters: AttendanceSummaryFilters) {
    return (
      await httpClient.get<AttendanceSummaryResponse>(
        '/admin-reports/attendance-summary',
        { params: filters },
      )
    ).data
  },
  async getJustificationsSummary() {
    return (
      await httpClient.get<JustificationsSummaryResponse>(
        '/admin-reports/justifications-summary',
      )
    ).data
  },
  async getSanctionsSummary() {
    return (
      await httpClient.get<SanctionsSummaryResponse>(
        '/admin-reports/sanctions-summary',
      )
    ).data
  },
}
