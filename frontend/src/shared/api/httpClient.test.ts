import { describe, expect, it, vi } from 'vitest'
import { httpClient } from './httpClient'
import { sessionStorageService } from '@/shared/session/sessionStorage'

describe('httpClient unauthorized response', () => {
  it('emits auth:unauthorized on 401 and leaves session storage to the single owner', async () => {
    sessionStorageService.set({ token: 'token', user: {} })
    const listener = vi.fn(); window.addEventListener('auth:unauthorized', listener)
    const handler = (httpClient.interceptors.response as any).handlers[0].rejected
    await expect(handler({ isAxiosError: true, response: { status: 401 } })).rejects.toMatchObject({ response: { status: 401 } })
    expect(listener).toHaveBeenCalledOnce()
    expect(sessionStorageService.get<{ token: string }>()?.token).toBe('token')
    window.removeEventListener('auth:unauthorized', listener)
    sessionStorageService.clear()
  })
})
