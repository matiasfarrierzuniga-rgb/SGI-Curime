import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminReportsApi } from '../api/adminReports.api'
import {
  adminReportsKeys,
  useAffiliatesSummary,
  useAttendanceSummary,
  useJustificationsSummary,
  useSanctionsSummary,
} from './useAdminReportsQueries'
import type {
  AdminReportDataSource,
  AdminReportMetadata,
} from '../model/adminReports.types'

vi.mock('../api/adminReports.api', () => ({
  adminReportsApi: {
    getAffiliatesSummary: vi.fn(),
    getAffiliates: vi.fn(),
    getAttendanceSummary: vi.fn(),
    getJustificationsSummary: vi.fn(),
    getSanctionsSummary: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return { queryClient, wrapper }
}

function metadata(dataSource: AdminReportDataSource): AdminReportMetadata {
  return {
    generatedAt: '2026-10-06T12:00:00.000Z',
    generatedBy: { id: 1, fullName: 'Administración' },
    period: { from: null, to: null },
    appliedFilters: {},
    dataSource,
    reportVersion: '1.0',
  }
}

describe('admin reports query keys', () => {
  it('includes attendance filters and separates statistics from row reports', () => {
    const filters = { dateFrom: '2026-01-01', assemblyId: 4 }

    expect(adminReportsKeys.all).toEqual(['admin-reports'])
    expect(adminReportsKeys.attendanceSummary(filters)).not.toEqual(
      adminReportsKeys.attendanceSummary({ ...filters, assemblyId: 5 }),
    )
    expect(adminReportsKeys.attendanceSummary(filters)).not.toEqual(
      adminReportsKeys.affiliates({
        page: 1,
        limit: 20,
      }),
    )
  })
})

describe('admin reports statistics hooks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads the existing affiliate summary', async () => {
    vi.mocked(adminReportsApi.getAffiliatesSummary).mockResolvedValue({
      metadata: metadata('AFFILIATE'),
      data: {
        total: 12,
        active: 9,
        inactive: 3,
        pendingRequests: 2,
        memberships: {
          total: 8,
          active: 6,
          expired: 2,
          expiringSoon: 1,
          withoutMembership: 4,
          expirationUnspecified: 0,
        },
        byAffiliateType: [{ affiliateType: 'Asociado', count: 12 }],
      },
    })
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useAffiliatesSummary(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toEqual({
      total: 12,
      active: 9,
      inactive: 3,
      pendingRequests: 2,
      memberships: {
        total: 8,
        active: 6,
        expired: 2,
        expiringSoon: 1,
        withoutMembership: 4,
        expirationUnspecified: 0,
      },
      byAffiliateType: [{ affiliateType: 'Asociado', count: 12 }],
    })
  })

  it('passes normalized attendance filters to the query', async () => {
    vi.mocked(adminReportsApi.getAttendanceSummary).mockResolvedValue({
      metadata: metadata('ASSEMBLY_CONVOCATION'),
      data: {
        assemblies: 0,
        totals: { present: 0, absent: 0, justified: 0 },
        data: [],
      },
    })
    const { wrapper } = createWrapper()
    const { result } = renderHook(
      () =>
        useAttendanceSummary({
          dateFrom: ' 2026-01-01 ',
          dateTo: '2026-12-31',
          assemblyId: 7,
        }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(adminReportsApi.getAttendanceSummary).toHaveBeenCalledWith({
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
      assemblyId: 7,
    })
  })

  it('does not query attendance for invalid date ranges or assembly ids', () => {
    const { wrapper } = createWrapper()
    const { result: reversedDates } = renderHook(
      () =>
        useAttendanceSummary({
          dateFrom: '2026-12-31',
          dateTo: '2026-01-01',
        }),
      { wrapper },
    )
    const { result: invalidAssembly } = renderHook(
      () => useAttendanceSummary({ assemblyId: 0 }),
      { wrapper },
    )

    expect(reversedDates.current.fetchStatus).toBe('idle')
    expect(invalidAssembly.current.fetchStatus).toBe('idle')
    expect(adminReportsApi.getAttendanceSummary).not.toHaveBeenCalled()
  })

  it('loads the existing justifications and sanctions statistics', async () => {
    vi.mocked(adminReportsApi.getJustificationsSummary).mockResolvedValue({
      metadata: metadata('ABSENCE_JUSTIFICATION'),
      data: { total: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 },
    })
    vi.mocked(adminReportsApi.getSanctionsSummary).mockResolvedValue({
      metadata: metadata('SANCTION'),
      data: { total: 0, ACTIVE: 0, RESOLVED: 0, REVOKED: 0 },
    })
    const { wrapper } = createWrapper()
    const { result: justifications } = renderHook(
      () => useJustificationsSummary(),
      { wrapper },
    )
    const { result: sanctions } = renderHook(
      () => useSanctionsSummary(),
      { wrapper },
    )

    await waitFor(() => {
      expect(justifications.current.isSuccess).toBe(true)
      expect(sanctions.current.isSuccess).toBe(true)
    })
    expect(adminReportsApi.getJustificationsSummary).toHaveBeenCalledOnce()
    expect(adminReportsApi.getSanctionsSummary).toHaveBeenCalledOnce()
  })

  it('surfaces backend failures through the query error state', async () => {
    vi.mocked(adminReportsApi.getSanctionsSummary).mockRejectedValue(
      new Error('Error de consulta'),
    )
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useSanctionsSummary(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toMatchObject({
      message: 'Error de consulta',
    })
  })
})
