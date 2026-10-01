import { describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { opportunitiesApi } from './opportunities.api'

vi.mock('@/shared/api/httpClient', () => ({ httpClient: { get: vi.fn() } }))

describe('opportunitiesApi.list', () => {
  it('emits frozen contract query parameters for combined filters', async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({ data: { data: [], total: 0, page: 2, limit: 10 } })
    await opportunitiesApi.list({ search: 'playa', status: 'PUBLISHED', page: 2, limit: 10 })
    expect(httpClient.get).toHaveBeenCalledWith('/volunteering/opportunities', { params: { search: 'playa', status: 'PUBLISHED', page: 2, limit: 10 } })
  })

  it('omits cleared optional filters while retaining pagination', async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({ data: { data: [], total: 0, page: 1, limit: 20 } })
    await opportunitiesApi.list({ search: '', status: undefined, page: 1, limit: 20 })
    expect(httpClient.get).toHaveBeenCalledWith('/volunteering/opportunities', { params: { page: 1, limit: 20 } })
  })
})
