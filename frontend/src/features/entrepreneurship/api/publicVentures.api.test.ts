import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { publicVenturesApi } from './publicVentures.api'

vi.mock('@/shared/api/httpClient', () => ({ httpClient: { get: vi.fn() } }))

describe('publicVenturesApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists public ventures with supported search and pagination parameters', async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({ data: { data: [], total: 0, page: 2, limit: 12 } })

    await publicVenturesApi.list({ search: 'café', page: 2, limit: 12 })

    expect(httpClient.get).toHaveBeenCalledWith('/public/ventures', { params: { search: 'café', page: 2, limit: 12 } })
  })

  it('omits an empty search term and gets a venture by numeric id', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: {} })

    await publicVenturesApi.list({ search: '', page: 1, limit: 12 })
    await publicVenturesApi.get(7)

    expect(httpClient.get).toHaveBeenNthCalledWith(1, '/public/ventures', { params: { page: 1, limit: 12 } })
    expect(httpClient.get).toHaveBeenNthCalledWith(2, '/public/ventures/7')
  })
})
