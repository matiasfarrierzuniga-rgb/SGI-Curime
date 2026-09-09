import { beforeEach, describe, expect, it, vi } from 'vitest'
import { donationsApi } from '../index'

const { httpClient } = vi.hoisted(() => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/shared/api/httpClient', () => ({ httpClient }))

describe('donationsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    httpClient.get.mockResolvedValue({ data: {} })
    httpClient.post.mockResolvedValue({ data: {} })
    httpClient.patch.mockResolvedValue({ data: {} })
    httpClient.delete.mockResolvedValue({ data: { deleted: true, id: 8 } })
  })

  it('serializes populated list filters and omits empty query params', async () => {
    await donationsApi.getDonations({
      search: '  aporte  ',
      status: 'CONFIRMED',
      method: 'SINPE_MOVIL',
      dateFrom: '2026-09-01',
      dateTo: '',
      page: 1,
      limit: 20,
    })

    expect(httpClient.get).toHaveBeenCalledWith('/donations', {
      params: {
        search: 'aporte',
        status: 'CONFIRMED',
        method: 'SINPE_MOVIL',
        dateFrom: '2026-09-01',
        page: 1,
        limit: 20,
      },
    })
  })

  it('uses the expected donation endpoints and payloads', async () => {
    const create = { amount: '25000.00', method: 'CASH' as const, receivedAt: '2026-09-09T16:00:00.000Z' }
    const update = { reference: 'REC-1', amount: '30000.00' }
    const cancel = { cancellationReason: 'Registro duplicado' }

    await donationsApi.getDonation(8)
    await donationsApi.createDonation(create)
    await donationsApi.updateDonation(8, update)
    await donationsApi.cancelDonation(8, cancel)
    await donationsApi.deleteDonation(8)

    expect(httpClient.get).toHaveBeenCalledWith('/donations/8')
    expect(httpClient.post).toHaveBeenCalledWith('/donations', create)
    expect(httpClient.patch).toHaveBeenCalledWith('/donations/8', update)
    expect(httpClient.patch).toHaveBeenCalledWith('/donations/8/cancel', cancel)
    expect(httpClient.delete).toHaveBeenCalledWith('/donations/8')
  })
})
