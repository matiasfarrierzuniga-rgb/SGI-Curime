import { describe, expect, it, vi } from 'vitest'
import { httpClient } from './httpClient'
import { sessionStorageService } from '../utils/sessionStorage'

describe('httpClient unauthorized response', () => {
  it('clears the session and emits auth:unauthorized on 401', async () => {
    sessionStorageService.set({ token: 'token', user: { id: 1, fullName: 'Ana', email: 'ana@test.com', role: 'Usuario', status: 'ACTIVE' } as any })
    const listener = vi.fn(); window.addEventListener('auth:unauthorized', listener)
    const handler = (httpClient.interceptors.response as any).handlers[0].rejected
    await expect(handler({ isAxiosError: true, response: { status: 401 } })).rejects.toMatchObject({ response: { status: 401 } })
    expect(sessionStorageService.get()).toBeNull(); expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener('auth:unauthorized', listener)
  })
})
