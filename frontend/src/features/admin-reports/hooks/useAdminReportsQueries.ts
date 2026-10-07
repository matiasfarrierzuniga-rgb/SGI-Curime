import { useQuery } from '@tanstack/react-query'
import { adminReportsApi } from '../api/adminReports.api'
import type {
  AffiliateReportFilters,
  AttendanceSummaryFilters,
} from '../model/adminReports.types'

export const adminReportsKeys = {
  all: ['admin-reports'] as const,
  affiliatesSummary: () =>
    [...adminReportsKeys.all, 'affiliates-summary'] as const,
  affiliates: (filters: AffiliateReportFilters) =>
    [...adminReportsKeys.all, 'affiliates', filters] as const,
  attendanceSummary: (filters: AttendanceSummaryFilters) =>
    [...adminReportsKeys.all, 'attendance-summary', filters] as const,
  justificationsSummary: () =>
    [...adminReportsKeys.all, 'justifications-summary'] as const,
  sanctionsSummary: () =>
    [...adminReportsKeys.all, 'sanctions-summary'] as const,
}

export function useAffiliatesSummary() {
  return useQuery({
    queryKey: adminReportsKeys.affiliatesSummary(),
    queryFn: adminReportsApi.getAffiliatesSummary,
  })
}

export function useAffiliateReport(filters: AffiliateReportFilters) {
  return useQuery({
    queryKey: adminReportsKeys.affiliates(filters),
    queryFn: () => adminReportsApi.getAffiliates(filters),
  })
}

function normalizeAttendanceFilters(filters: AttendanceSummaryFilters) {
  return {
    dateFrom: filters.dateFrom?.trim() || undefined,
    dateTo: filters.dateTo?.trim() || undefined,
    assemblyId: filters.assemblyId,
  }
}

function hasValidAttendanceFilters(filters: AttendanceSummaryFilters) {
  const { dateFrom, dateTo, assemblyId } = normalizeAttendanceFilters(filters)
  const validDates =
    (!dateFrom || Number.isFinite(Date.parse(dateFrom))) &&
    (!dateTo || Number.isFinite(Date.parse(dateTo))) &&
    (!dateFrom || !dateTo || Date.parse(dateFrom) <= Date.parse(dateTo))
  const validAssemblyId =
    assemblyId === undefined ||
    (Number.isInteger(assemblyId) && assemblyId > 0)

  return validDates && validAssemblyId
}

export function useAttendanceSummary(filters: AttendanceSummaryFilters = {}) {
  const normalizedFilters = normalizeAttendanceFilters(filters)

  return useQuery({
    queryKey: adminReportsKeys.attendanceSummary(normalizedFilters),
    queryFn: () => adminReportsApi.getAttendanceSummary(normalizedFilters),
    enabled: hasValidAttendanceFilters(normalizedFilters),
  })
}

export function useJustificationsSummary() {
  return useQuery({
    queryKey: adminReportsKeys.justificationsSummary(),
    queryFn: adminReportsApi.getJustificationsSummary,
  })
}

export function useSanctionsSummary() {
  return useQuery({
    queryKey: adminReportsKeys.sanctionsSummary(),
    queryFn: adminReportsApi.getSanctionsSummary,
  })
}
