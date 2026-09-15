import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { inventoryReportsService } from './inventoryReportsService'

vi.mock('@/shared/api/httpClient', () => ({
  httpClient: { get: vi.fn() },
}))

const metadata = {
  generatedAt: '2026-09-14T12:00:00.000Z',
  generatedBy: { id: 7, fullName: 'Persona Gestora' },
  period: { from: null, to: null },
  appliedFilters: {},
  dataSource: 'INVENTORY_ITEM',
  reportVersion: '1.0',
}

describe('inventoryReportsService', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['summary', '/inventory/reports/summary', undefined, { activeItems: 8 }],
    ['stock', '/inventory/reports/stock', { page: 2 }, { data: [], total: 0, page: 2, limit: 20 }],
    ['movements', '/inventory/reports/movements', { dateFrom: '2026-01-01' }, { period: { dateFrom: '2026-01-01', dateTo: null }, summary: {} }],
    ['loans', '/inventory/reports/loans', { categoryId: 3 }, { period: { dateFrom: null, dateTo: null }, summary: {} }],
  ] as const)('unwraps the %s report envelope for existing consumers', async (method, url, params, data) => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({ data: { metadata, data } })

    const result = params
      ? await inventoryReportsService[method](params)
      : await inventoryReportsService.summary()

    expect(httpClient.get).toHaveBeenCalledWith(url, ...(params ? [{ params }] : []))
    expect(result).toBe(data)
  })
})
