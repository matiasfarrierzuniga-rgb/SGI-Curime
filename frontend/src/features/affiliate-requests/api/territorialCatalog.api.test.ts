import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { territorialCatalogApi } from './territorialCatalog.api'

vi.mock('@/shared/api/httpClient', () => ({ httpClient: { get: vi.fn() } }))

describe('territorialCatalogApi', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(httpClient.get).mockResolvedValue({ data: { catalogVersion: 'fixture-v1', items: [] } }) })

  it('sends each complete parent path and forwards cancellation signals', async () => {
    const signal = new AbortController().signal
    await territorialCatalogApi.localities('5', '02', '01', { signal })

    expect(httpClient.get).toHaveBeenCalledWith('/territorial-catalog/localities', {
      params: { provinceCode: '5', cantonCode: '02', districtCode: '01' }, signal,
    })
  })
})
