import { afterEach, describe, expect, it, vi } from 'vitest'
import { configureAuthSessionAdapter } from './authSessionAdapter'
import { httpClient } from './httpClient'

const responseError = (url: string, status = 401, epoch = 1) => ({ isAxiosError: true, config: { url, headers: {}, _sessionEpoch: epoch }, response: { status } })
const responseHandler = () => (httpClient.interceptors.response as any).handlers[0].rejected
const requestHandler = () => (httpClient.interceptors.request as any).handlers[0].fulfilled

describe('httpClient session handling', () => {
  let unregister: (() => void) | undefined

  afterEach(() => {
    unregister?.()
    unregister = undefined
    vi.restoreAllMocks()
  })

  function adapter(overrides: Partial<Parameters<typeof configureAuthSessionAdapter>[0]> = {}) {
    const value = {
      getAccessToken: vi.fn(() => 'access-token'),
      getSessionEpoch: vi.fn(() => 1),
      renewAccessToken: vi.fn(async () => 'fresh'),
      invalidateSession: vi.fn(),
      refreshAccessContext: vi.fn(async () => undefined),
      ...overrides,
    }
    unregister = configureAuthSessionAdapter(value)
    return value
  }

  it('uses the registered in-memory token without Web Storage', async () => {
    const auth = adapter()
    const config = await requestHandler()({ url: '/users/me', headers: {} })
    expect(httpClient.defaults.withCredentials).toBe(true)
    expect(config.headers.Authorization).toBe('Bearer access-token')
    expect(config._sessionEpoch).toBe(1)
    expect(sessionStorage.length).toBe(0)
    expect(localStorage.length).toBe(0)
    expect(auth.getAccessToken).toHaveBeenCalledOnce()
  })

  it('refreshes once through the adapter and retries a protected request once', async () => {
    const auth = adapter()
    const request = vi.spyOn(httpClient, 'request').mockResolvedValue({ data: 'retried' } as any)
    const result = await responseHandler()(responseError('/users/me'))
    expect(auth.renewAccessToken).toHaveBeenCalledOnce()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ _retry: true, headers: expect.objectContaining({ Authorization: 'Bearer fresh' }) }))
    expect(result).toEqual({ data: 'retried' })
  })

  it('shares one adapter renewal across concurrent 401 responses', async () => {
    const auth = adapter()
    vi.spyOn(httpClient, 'request').mockResolvedValue({} as any)
    await Promise.all([responseHandler()(responseError('/one')), responseHandler()(responseError('/two'))])
    expect(auth.renewAccessToken).toHaveBeenCalledOnce()
  })

  it('delegates failed renewal invalidation to the provider without persisting state', async () => {
    const auth = adapter({ renewAccessToken: vi.fn().mockRejectedValue(new Error('expired cookie')) })
    await expect(responseHandler()(responseError('/users/me'))).rejects.toMatchObject({ response: { status: 401 } })
    expect(auth.invalidateSession).toHaveBeenCalledWith('renewal-failed')
    expect(sessionStorage.length).toBe(0)
  })

  it('does not renew session endpoint 401 responses and keeps 403 as context refresh', async () => {
    const auth = adapter()
    await expect(responseHandler()(responseError('/refresh'))).rejects.toMatchObject({ response: { status: 401 } })
    await expect(responseHandler()(responseError('/logout'))).rejects.toMatchObject({ response: { status: 401 } })
    await expect(responseHandler()(responseError('/users/me', 403))).rejects.toMatchObject({ response: { status: 403 } })
    expect(auth.renewAccessToken).not.toHaveBeenCalled()
    expect(auth.invalidateSession).not.toHaveBeenCalled()
    expect(auth.refreshAccessContext).toHaveBeenCalledOnce()
  })
})
