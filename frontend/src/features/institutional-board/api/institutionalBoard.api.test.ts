import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { institutionalBoardApi } from './institutionalBoard.api'

vi.mock('@/shared/api/httpClient', () => ({ httpClient: { post: vi.fn() } }))

describe('institutionalBoardApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts an atomic replacement command', async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ data: {} })
    const input = { personId: 9, position: 'PRESIDENT' as const, seatNumber: null, startsOn: '2027-01-01', endsOn: null, replacedEndsOn: '2026-12-31' }

    await institutionalBoardApi.replaceAppointment(2, input)

    expect(httpClient.post).toHaveBeenCalledWith('/institutional-board/appointments/2/replacement', input)
  })
})
