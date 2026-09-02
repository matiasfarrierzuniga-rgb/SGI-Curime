import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { affiliateRequestsApi } from './affiliateRequests.api'

vi.mock('@/shared/api/httpClient', () => ({
  httpClient: { get: vi.fn(), patch: vi.fn() },
}))

describe('affiliateRequestsApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses supported list filters through GET', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { data: [], total: 0, page: 2, limit: 10 } })
    const filters = { status: 'PENDING' as const, search: 'Ana', email: 'ana@example.com', identification: '1-2', page: 2, limit: 10 }

    await affiliateRequestsApi.list(filters)

    expect(httpClient.get).toHaveBeenCalledWith('/affiliate-requests', { params: filters })
  })

  it('gets request detail through its ID path', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { id: 7 } })

    await affiliateRequestsApi.detail(7)

    expect(httpClient.get).toHaveBeenCalledWith('/affiliate-requests/7')
  })

  it('approves through the existing PATCH endpoint only', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue({ data: { affiliate: { id: 8 }, affiliateRequest: { id: 7 } } })

    await affiliateRequestsApi.approve(7)

    expect(httpClient.patch).toHaveBeenCalledWith('/affiliate-requests/7/approve')
    expect('create' in affiliateRequestsApi).toBe(false)
  })

  it('rejects with its required reason payload', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue({ data: { id: 7 } })
    const payload = { rejectionReason: 'Información incompleta' }

    await affiliateRequestsApi.reject(7, payload)

    expect(httpClient.patch).toHaveBeenCalledWith('/affiliate-requests/7/reject', payload)
  })
})
