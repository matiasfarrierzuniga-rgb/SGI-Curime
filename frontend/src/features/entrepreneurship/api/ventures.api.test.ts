import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { venturesApi } from './ventures.api'

vi.mock('@/shared/api/httpClient', () => ({ httpClient: { get: vi.fn() } }))

describe('venturesApi.list', () => {
  beforeEach(() => vi.clearAllMocks())

  it('emits contract query parameters for combined filters', async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({ data: { data: [], total: 0, page: 2, limit: 10, byStatus: [] } })

    await venturesApi.list({
      search: 'postre',
      status: 'ACTIVE',
      publicationStatus: 'PUBLISHED',
      location: 'Curime',
      dateFrom: '2026-01-01T00:00:00.000Z',
      dateTo: '2026-12-31T23:59:59.999Z',
      page: 2,
      limit: 10,
    })

    expect(httpClient.get).toHaveBeenCalledWith('/ventures', {
      params: {
        search: 'postre',
        status: 'ACTIVE',
        publicationStatus: 'PUBLISHED',
        location: 'Curime',
        dateFrom: '2026-01-01T00:00:00.000Z',
        dateTo: '2026-12-31T23:59:59.999Z',
        page: 2,
        limit: 10,
      },
    })
  })

  it('omits cleared optional filters while retaining pagination', async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({ data: { data: [], total: 0, page: 1, limit: 20, byStatus: [] } })

    await venturesApi.list({
      search: '',
      status: undefined,
      publicationStatus: undefined,
      location: '',
      dateFrom: undefined,
      dateTo: undefined,
      page: 1,
      limit: 20,
    })

    expect(httpClient.get).toHaveBeenCalledWith('/ventures', { params: { page: 1, limit: 20 } })
  })
})
