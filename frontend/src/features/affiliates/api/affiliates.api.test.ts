import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { affiliatesService } from './affiliates.api'

vi.mock('@/shared/api/httpClient', () => ({
  httpClient: { get: vi.fn(), patch: vi.fn() },
}))

describe('affiliatesService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists affiliates with contract filters', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { data: [], total: 0, page: 2, limit: 10 } })
    const filters = { search: 'Ana', name: 'Ana Pérez', identification: '1-2', status: 'ACTIVE' as const, page: 2, limit: 10 }

    await affiliatesService.list(filters)

    expect(httpClient.get).toHaveBeenCalledWith('/affiliates', { params: filters })
  })

  it('gets affiliate detail', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { id: 7 } })

    await affiliatesService.detail(7)

    expect(httpClient.get).toHaveBeenCalledWith('/affiliates/7')
  })

  it('updates an affiliate through PATCH', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue({ data: { id: 7 } })
    const payload = { fullName: 'Ana Pérez' }

    await affiliatesService.update(7, payload)

    expect(httpClient.patch).toHaveBeenCalledWith('/affiliates/7', payload)
  })

  it('uses status endpoints and exposes no create mutation', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue({ data: { id: 7 } })

    await affiliatesService.activate(7)
    await affiliatesService.deactivate(7)

    expect(httpClient.patch).toHaveBeenNthCalledWith(1, '/affiliates/7/activate')
    expect(httpClient.patch).toHaveBeenNthCalledWith(2, '/affiliates/7/deactivate')
    expect('create' in affiliatesService).toBe(false)
  })
})
