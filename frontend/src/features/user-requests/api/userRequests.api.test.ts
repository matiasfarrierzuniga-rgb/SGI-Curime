import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { userRequestsService } from './userRequests.api'

vi.mock('@/shared/api/httpClient', () => ({
  httpClient: { post: vi.fn(), get: vi.fn(), patch: vi.fn() },
}))

describe('userRequestsService.create', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses POST /register for public request snapshots', async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ data: { id: 4, status: 'PENDING' } })
    const payload = {
      fullName: 'Ana María Rodríguez Mora',
      firstName: 'Ana María',
      firstSurname: 'Rodríguez',
      secondSurname: 'Mora',
      identificationType: 'NATIONAL' as const,
      identification: '123456789',
      email: 'ana@example.com',
      phoneCountryCode: '+506',
      phoneNationalNumber: '88881234',
      reason: 'Participar',
    }

    await userRequestsService.create(payload)

    expect(httpClient.post).toHaveBeenCalledWith('/register', payload)
  })
})
