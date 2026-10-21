import { describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { venturesApi } from './ventures.api'

vi.mock('@/shared/api/httpClient', () => ({ httpClient: { get: vi.fn(), patch: vi.fn() } }))

describe('venturesApi.list', () => {
  it('emits contract query parameters for combined filters', async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({ data: { data: [], total: 0, page: 2, limit: 10 } })

    await venturesApi.list({ search: 'postre', status: 'ACTIVE', publicationStatus: 'PUBLISHED', page: 2, limit: 10 })

    expect(httpClient.get).toHaveBeenCalledWith('/ventures', {
      params: { search: 'postre', status: 'ACTIVE', publicationStatus: 'PUBLISHED', page: 2, limit: 10 },
    })
  })

  it('omits cleared optional filters while retaining pagination', async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({ data: { data: [], total: 0, page: 1, limit: 20 } })

    await venturesApi.list({ search: '', status: undefined, publicationStatus: undefined, page: 1, limit: 20 })

    expect(httpClient.get).toHaveBeenCalledWith('/ventures', { params: { page: 1, limit: 20 } })
  })
})

describe('venturesApi publication transitions', () => {
  it('uses dedicated publish and unpublish endpoints', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue({ data: { id: 7 } } as never)

    await venturesApi.publish(7)
    await venturesApi.unpublish(7)

    expect(httpClient.patch).toHaveBeenNthCalledWith(1, '/ventures/7/publish')
    expect(httpClient.patch).toHaveBeenNthCalledWith(2, '/ventures/7/unpublish')
  })
})
