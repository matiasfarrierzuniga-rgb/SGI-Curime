import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { adminReportsApi } from './adminReports.api'

vi.mock('@/shared/api/httpClient', () => ({
  httpClient: { get: vi.fn() },
}))

describe('adminReportsApi statistics', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the existing summary endpoints', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: {} })

    await adminReportsApi.getAffiliatesSummary()
    await adminReportsApi.exportAffiliates({
      search: 'Ana Pérez',
      affiliateType: 'Asociado',
      affiliateStatus: 'ACTIVE',
      subscriptionStatus: 'CURRENT',
      dateFrom: '2026-01-01T00:00:00.000Z',
      dateTo: '2026-12-31T23:59:59.999Z',
      page: 3,
      limit: 20,
    })
    await adminReportsApi.getAttendanceSummary({
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
      assemblyId: 7,
    })
    await adminReportsApi.getJustificationsSummary()
    await adminReportsApi.getSanctionsSummary()

    expect(httpClient.get).toHaveBeenNthCalledWith(
      1,
      '/admin-reports/affiliates-summary',
    )
    expect(httpClient.get).toHaveBeenNthCalledWith(
      2,
      '/admin-reports/affiliates/export',
      {
        params: {
          search: 'Ana Pérez',
          affiliateType: 'Asociado',
          affiliateStatus: 'ACTIVE',
          subscriptionStatus: 'CURRENT',
          dateFrom: '2026-01-01T00:00:00.000Z',
          dateTo: '2026-12-31T23:59:59.999Z',
        },
        responseType: 'blob',
      },
    )
    expect(httpClient.get).toHaveBeenNthCalledWith(
      3,
      '/admin-reports/attendance-summary',
      {
        params: {
          dateFrom: '2026-01-01',
          dateTo: '2026-12-31',
          assemblyId: 7,
        },
      },
    )
    expect(httpClient.get).toHaveBeenNthCalledWith(
      4,
      '/admin-reports/justifications-summary',
    )
    expect(httpClient.get).toHaveBeenNthCalledWith(
      5,
      '/admin-reports/sanctions-summary',
    )
  })
})
