import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { assembliesApi } from './assemblies.api'

vi.mock('@/shared/api/httpClient', () => ({
  httpClient: { get: vi.fn() },
}))

describe('assembliesApi.list', () => {
  beforeEach(() => vi.clearAllMocks())

  it('passes report filters and preserves backend pagination metadata', async () => {
    const response = {
      data: {
        data: [],
        total: 0,
        page: 2,
        limit: 20,
        byStatus: [],
        byType: [],
      },
    }
    vi.mocked(httpClient.get).mockResolvedValue(response)

    await expect(
      assembliesApi.list({
        search: 'Asamblea',
        status: 'COMPLETED',
        type: 'ORDINARY',
        dateFrom: '2026-01-01T00:00:00.000Z',
        dateTo: '2026-12-31T23:59:59.999Z',
        page: 2,
        limit: 20,
      }),
    ).resolves.toEqual(response.data)
    expect(httpClient.get).toHaveBeenCalledWith('/assemblies', {
      params: {
        search: 'Asamblea',
        status: 'COMPLETED',
        type: 'ORDINARY',
        dateFrom: '2026-01-01T00:00:00.000Z',
        dateTo: '2026-12-31T23:59:59.999Z',
        page: 2,
        limit: 20,
      },
    })
  })
})
