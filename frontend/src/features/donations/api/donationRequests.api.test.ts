import { describe, expect, it, vi } from 'vitest'
import { donationRequestsApi } from './donationRequests.api'

const { httpClient } = vi.hoisted(() => ({ httpClient: { post: vi.fn().mockResolvedValue({ data: { id: 'request', status: 'PENDING' } }), get: vi.fn(), patch: vi.fn() } }))
vi.mock('@/shared/api/httpClient', () => ({ httpClient }))

describe('public donation request transport', () => {
  it('sends only a pending request to the public endpoint', async () => {
    const input = { donorName: 'Persona', email: 'p@example.org', kind: 'MONETARY' as const, modality: 'DIGITAL' as const, paymentPreference: 'SINPE' as const, approximateAmount: '1000', anonymousPublic: false }
    await expect(donationRequestsApi.create(input, 'opaque-key')).resolves.toEqual({ id: 'request', status: 'PENDING' })
    expect(httpClient.post).toHaveBeenCalledWith('/public/donation-requests', input, { headers: { 'Idempotency-Key': 'opaque-key' } })
  })

  it('uses separate protected endpoints for review without confirming receipt', async () => {
    httpClient.get.mockResolvedValueOnce({ data: { data: [], total: 0, page: 1, limit: 20 } })
    httpClient.patch.mockResolvedValueOnce({ data: { id: 'request', status: 'REJECTED' } })
    await donationRequestsApi.list(2)
    await donationRequestsApi.transition('request', 'reject', 'No corresponde')
    expect(httpClient.get).toHaveBeenCalledWith('/donation-requests', { params: { page: 2, limit: 20 } })
    expect(httpClient.patch).toHaveBeenCalledWith('/donation-requests/request/reject', { reason: 'No corresponde' })
  })
})
