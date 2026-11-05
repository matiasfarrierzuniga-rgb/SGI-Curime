import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { publicOpportunitiesApi } from './publicOpportunities.api'

vi.mock('@/shared/api/httpClient', () => ({ httpClient: { get: vi.fn(), post: vi.fn() } }))

describe('publicOpportunitiesApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses only public endpoints with search and pagination', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { data: [], total: 0, page: 1, limit: 12 } })
    await publicOpportunitiesApi.list({ search: 'parque', page: 1, limit: 12 })
    await publicOpportunitiesApi.get(7)
    expect(httpClient.get).toHaveBeenNthCalledWith(1, '/public/volunteering/opportunities', { params: { search: 'parque', page: 1, limit: 12 } })
    expect(httpClient.get).toHaveBeenNthCalledWith(2, '/public/volunteering/opportunities/7')
  })

  it('posts a community application without an ERP endpoint', async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ data: { received: true } })
    const input = { fullName: 'Ana Pérez', email: 'ana@example.test' }
    await expect(publicOpportunitiesApi.apply(7, input)).resolves.toEqual({ received: true })
    expect(httpClient.post).toHaveBeenCalledWith('/public/volunteering/opportunities/7/applications', input)
  })
})
