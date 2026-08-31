import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { eventsApi } from './events.api'

vi.mock('@/shared/api/httpClient', () => ({ httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }))

describe('eventsApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('gets published events only from public API', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: [] })

    await eventsApi.listPublic()

    expect(httpClient.get).toHaveBeenCalledWith('/public/events')
  })

  it('uses explicit publication commands', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue({ data: { id: 3 } })

    await eventsApi.publish(3)
    await eventsApi.archive(3)

    expect(httpClient.patch).toHaveBeenCalledWith('/events/3/publish')
    expect(httpClient.patch).toHaveBeenCalledWith('/events/3/archive')
  })
})
