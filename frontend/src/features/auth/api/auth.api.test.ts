import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { authService } from './auth.api'

vi.mock('@/shared/api/httpClient', () => ({
  httpClient: {
    patch: vi.fn(),
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('authService.changePassword', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends the backend ChangePasswordDto contract without changing the endpoint', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue({ data: { message: 'Password changed successfully' } } as never)

    const payload = {
      currentPassword: 'Old1234567',
      newPassword: 'New1234567',
      newPasswordConfirmation: 'New1234567',
    }

    await expect(authService.changePassword(payload)).resolves.toEqual({ message: 'Password changed successfully' })
    expect(httpClient.patch).toHaveBeenCalledWith('/auth/change-password', payload)
  })
})
