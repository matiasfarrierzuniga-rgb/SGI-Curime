import { describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { opportunitiesApi } from './opportunities.api'

vi.mock('@/shared/api/httpClient', () => ({ httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }))

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

  it('uses administrative endpoints for publication, sessions and review', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: [] })
    vi.mocked(httpClient.post).mockResolvedValue({ data: {} })
    vi.mocked(httpClient.patch).mockResolvedValue({ data: {} })
    await opportunitiesApi.sessions(4)
    await opportunitiesApi.addSession(4, { startAt: '2026-11-01T12:00:00Z', endAt: '2026-11-01T13:00:00Z' })
    await opportunitiesApi.publish(4)
    await opportunitiesApi.close(4)
    await opportunitiesApi.applications(4)
    await opportunitiesApi.approveApplication(8, { createPerson: true })
    await opportunitiesApi.rejectApplication(8, 'No procede')
    expect(httpClient.get).toHaveBeenCalledWith('/volunteering/opportunities/4/sessions')
    expect(httpClient.post).toHaveBeenCalledWith('/volunteering/opportunities/4/sessions', { startAt: '2026-11-01T12:00:00Z', endAt: '2026-11-01T13:00:00Z' })
    expect(httpClient.patch).toHaveBeenCalledWith('/volunteering/opportunities/4/publish')
    expect(httpClient.patch).toHaveBeenCalledWith('/volunteering/opportunities/4/close')
    expect(httpClient.get).toHaveBeenCalledWith('/volunteering/opportunities/4/applications')
    expect(httpClient.patch).toHaveBeenCalledWith('/volunteering/applications/8/approve', { createPerson: true })
    expect(httpClient.patch).toHaveBeenCalledWith('/volunteering/applications/8/reject', { rejectionReason: 'No procede' })
  })
})
