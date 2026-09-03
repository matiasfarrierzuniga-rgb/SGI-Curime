import { afterEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from './httpClient'
import { sessionStorageService } from '@/shared/session/sessionStorage'

const responseError = (url: string, status = 401) => ({ isAxiosError: true, config: { url, headers: {} }, response: { status } })
const responseHandler = () => (httpClient.interceptors.response as any).handlers[0].rejected
const requestHandler = () => (httpClient.interceptors.request as any).handlers[0].fulfilled

describe('httpClient session handling', () => {
  afterEach(() => { localStorage.clear(); vi.restoreAllMocks() })

  it('enables credentials and keeps the stored access token as Bearer', async () => {
    sessionStorageService.set({ token: 'access-token', user: {} })
    const config = await requestHandler()({ headers: {} })
    expect(httpClient.defaults.withCredentials).toBe(true)
    expect(config.headers.Authorization).toBe('Bearer access-token')
  })

  it('refreshes once, stores access token, and retries a protected request once', async () => {
    sessionStorageService.set({ token: 'expired', user: { id: 1 } })
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue({ data: { accessToken: 'fresh' } } as any)
    const request = vi.spyOn(httpClient, 'request').mockResolvedValue({ data: 'retried' } as any)
    const result = await responseHandler()(responseError('/users/me'))
    expect(post).toHaveBeenCalledWith('/refresh')
    expect(sessionStorageService.get<{ token: string }>()?.token).toBe('fresh')
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ _retry: true, headers: expect.objectContaining({ Authorization: 'Bearer fresh' }) }))
    expect(result).toEqual({ data: 'retried' })
  })

  it('shares one refresh request across concurrent 401 responses', async () => {
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue({ data: { accessToken: 'fresh' } } as any)
    vi.spyOn(httpClient, 'request').mockResolvedValue({} as any)
    await Promise.all([responseHandler()(responseError('/one')), responseHandler()(responseError('/two'))])
    expect(post).toHaveBeenCalledOnce()
  })

  it('emits unauthorized when refresh fails without clearing session itself', async () => {
    sessionStorageService.set({ token: 'expired', user: {} })
    vi.spyOn(httpClient, 'post').mockRejectedValue(new Error('expired cookie'))
    const listener = vi.fn(); window.addEventListener('auth:unauthorized', listener)
    await expect(responseHandler()(responseError('/users/me'))).rejects.toMatchObject({ response: { status: 401 } })
    expect(listener).toHaveBeenCalledOnce()
    expect(sessionStorageService.get<{ token: string }>()?.token).toBe('expired')
    window.removeEventListener('auth:unauthorized', listener)
  })

  it('does not refresh or emit unauthorized for logout, refresh, or login 401 responses', async () => {
    const post = vi.spyOn(httpClient, 'post')
    const request = vi.spyOn(httpClient, 'request')
    const listener = vi.fn(); window.addEventListener('auth:unauthorized', listener)
    await expect(responseHandler()(responseError('/logout'))).rejects.toMatchObject({ response: { status: 401 } })
    await expect(responseHandler()(responseError('/refresh'))).rejects.toMatchObject({ response: { status: 401 } })
    await expect(responseHandler()(responseError('/login'))).rejects.toMatchObject({ response: { status: 401 } })
    expect(post).not.toHaveBeenCalled()
    expect(request).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
    window.removeEventListener('auth:unauthorized', listener)
  })

  it('does not refresh or emit unauthorized for 403 responses', async () => {
    const post = vi.spyOn(httpClient, 'post')
    const listener = vi.fn(); window.addEventListener('auth:unauthorized', listener)
    await expect(responseHandler()(responseError('/users/me', 403))).rejects.toMatchObject({ response: { status: 403 } })
    expect(post).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
    window.removeEventListener('auth:unauthorized', listener)
  })
})
