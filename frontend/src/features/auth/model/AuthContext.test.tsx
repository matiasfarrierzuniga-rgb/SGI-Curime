import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAuthSessionAdapter } from '@/shared/api/authSessionAdapter'
import { LEGACY_SESSION_STORAGE_KEY } from '@/shared/session/sessionStorage'
import { AuthProvider, useAuth } from './AuthContext'
import { authService } from '../api/auth.api'

vi.mock('../api/auth.api', () => ({ authService: { me: vi.fn(), login: vi.fn(), logout: vi.fn(), refresh: vi.fn(), changePassword: vi.fn() } }))

const user = { id: 1, fullName: 'Ana', email: 'ana@curime.cr', role: 'Usuario', status: 'ACTIVE' } as any
const userB = { id: 2, fullName: 'Bea', email: 'bea@curime.cr', role: 'Usuario', status: 'ACTIVE' } as any
const unauthorized = { isAxiosError: true, response: { status: 401 } }

function Probe() {
  const auth = useAuth()
  return <>
    <span>{auth.isLoading ? 'loading' : 'ready'}</span>
    <span>phase:{auth.phase}</span>
    <span>{auth.user?.fullName ?? 'anonymous'}</span>
    <button onClick={() => void auth.login({ email: 'ana@curime.cr', password: 'not-inspected' }).catch(() => undefined)}>login</button>
    <button onClick={() => void auth.logout()}>logout</button>
    <button onClick={() => void auth.changePassword({ currentPassword: 'Old1234567', newPassword: 'New1234567', newPasswordConfirmation: 'New1234567' }).catch(() => undefined)}>change-password</button>
  </>
}

function renderAuth() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return { queryClient, ...render(<QueryClientProvider client={queryClient}><AuthProvider><Probe /></AuthProvider></QueryClientProvider>) }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((next) => { resolve = next })
  return { promise, resolve }
}

describe('AuthContext memory-only session ownership', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    vi.mocked(authService.refresh).mockRejectedValue(unauthorized)
    vi.mocked(authService.logout).mockResolvedValue({ message: 'Logged out' })
  })

  it('recovers a valid cookie session into memory after reload', async () => {
    vi.mocked(authService.refresh).mockResolvedValue({ accessToken: 'cookie-token' })
    vi.mocked(authService.me).mockResolvedValue(user)
    renderAuth()

    expect(screen.getByText('loading')).toBeInTheDocument()
    await screen.findByText('Ana')
    expect(screen.getByText('phase:authenticated')).toBeInTheDocument()
    expect(getAuthSessionAdapter()?.getAccessToken()).toBe('cookie-token')
    expect(sessionStorage.length).toBe(0)
    expect(localStorage.length).toBe(0)
  })

  it('purges only the legacy key and becomes anonymous for an invalid cookie', async () => {
    sessionStorage.setItem(LEGACY_SESSION_STORAGE_KEY, JSON.stringify({ token: 'legacy', user }))
    sessionStorage.setItem('unrelated', 'keep')
    renderAuth()

    await screen.findByText('phase:anonymous')
    expect(sessionStorage.getItem(LEGACY_SESSION_STORAGE_KEY)).toBeNull()
    expect(sessionStorage.getItem('unrelated')).toBe('keep')
    expect(getAuthSessionAdapter()?.getAccessToken()).toBeNull()
  })

  it('reports a transient bootstrap failure without automatic retry', async () => {
    vi.mocked(authService.refresh).mockRejectedValue(new Error('network unavailable'))
    renderAuth()

    await screen.findByText('phase:refresh-failed')
    expect(authService.refresh).toHaveBeenCalledOnce()
    expect(getAuthSessionAdapter()?.getAccessToken()).toBeNull()
  })

  it('keeps successful login credentials in provider memory only', async () => {
    vi.mocked(authService.login).mockResolvedValue({ accessToken: 'new-token', user })
    vi.mocked(authService.me).mockResolvedValue(user)
    renderAuth()
    await screen.findByText('phase:anonymous')
    fireEvent.click(screen.getByText('login'))
    await screen.findByText('Ana')

    expect(getAuthSessionAdapter()?.getAccessToken()).toBe('new-token')
    expect(sessionStorage.length).toBe(0)
    expect(localStorage.length).toBe(0)
    expect(screen.queryByText('new-token')).not.toBeInTheDocument()
  })

  it('clears memory, cache, and user state on logout', async () => {
    vi.mocked(authService.login).mockResolvedValue({ accessToken: 'token', user })
    vi.mocked(authService.me).mockResolvedValue(user)
    const { queryClient } = renderAuth()
    await screen.findByText('phase:anonymous')
    fireEvent.click(screen.getByText('login'))
    await screen.findByText('Ana')
    queryClient.setQueryData(['sensitive'], user)
    fireEvent.click(screen.getByText('logout'))
    await screen.findByText('phase:anonymous')

    expect(getAuthSessionAdapter()?.getAccessToken()).toBeNull()
    expect(queryClient.getQueryData(['sensitive'])).toBeUndefined()
  })

  it('invalidates locally after authenticated password change without calling logout', async () => {
    vi.mocked(authService.login).mockResolvedValue({ accessToken: 'token', user })
    vi.mocked(authService.me).mockResolvedValue(user)
    vi.mocked(authService.changePassword).mockResolvedValue({ message: 'Changed' })
    const { queryClient } = renderAuth()
    await screen.findByText('phase:anonymous')
    fireEvent.click(screen.getByText('login'))
    await screen.findByText('Ana')
    queryClient.setQueryData(['sensitive'], user)

    fireEvent.click(screen.getByText('change-password'))
    await screen.findByText('phase:anonymous')

    expect(authService.changePassword).toHaveBeenCalledWith({ currentPassword: 'Old1234567', newPassword: 'New1234567', newPasswordConfirmation: 'New1234567' })
    expect(authService.logout).not.toHaveBeenCalled()
    expect(getAuthSessionAdapter()?.getAccessToken()).toBeNull()
    expect(queryClient.getQueryData(['sensitive'])).toBeUndefined()
  })

  it('preserves a valid session when password change fails', async () => {
    vi.mocked(authService.login).mockResolvedValue({ accessToken: 'token', user })
    vi.mocked(authService.me).mockResolvedValue(user)
    vi.mocked(authService.changePassword).mockRejectedValue(new Error('current password rejected'))
    renderAuth()
    await screen.findByText('phase:anonymous')
    fireEvent.click(screen.getByText('login'))
    await screen.findByText('Ana')

    fireEvent.click(screen.getByText('change-password'))
    await waitFor(() => expect(authService.changePassword).toHaveBeenCalledOnce())

    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('phase:authenticated')).toBeInTheDocument()
    expect(getAuthSessionAdapter()?.getAccessToken()).toBe('token')
    expect(authService.logout).not.toHaveBeenCalled()
  })

  it('cannot let a late logout erase a newer login context', async () => {
    let resolveLogout!: (value: { message: string }) => void
    const pendingLogout = new Promise<{ message: string }>((resolve) => { resolveLogout = resolve })
    vi.mocked(authService.login)
      .mockResolvedValueOnce({ accessToken: 'token-a', user })
      .mockResolvedValueOnce({ accessToken: 'token-b', user: userB })
    vi.mocked(authService.me)
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(userB)
    vi.mocked(authService.logout).mockReturnValue(pendingLogout)
    renderAuth()
    await screen.findByText('phase:anonymous')
    fireEvent.click(screen.getByText('login'))
    await screen.findByText('Ana')

    fireEvent.click(screen.getByText('logout'))
    fireEvent.click(screen.getByText('login'))
    await act(async () => resolveLogout({ message: 'Logged out' }))

    await screen.findByText('Bea')
    expect(getAuthSessionAdapter()?.getAccessToken()).toBe('token-b')
    expect(screen.getByText('phase:authenticated')).toBeInTheDocument()
  })

  it('ignores a late bootstrap refresh after local invalidation', async () => {
    const pendingRefresh = deferred<{ accessToken: string }>()
    vi.mocked(authService.refresh).mockReturnValue(pendingRefresh.promise)
    renderAuth()
    fireEvent.click(screen.getByText('logout'))
    expect(screen.getByText('phase:anonymous')).toBeInTheDocument()
    await act(async () => pendingRefresh.resolve({ accessToken: 'stale-token' }))

    expect(screen.getByText('phase:anonymous')).toBeInTheDocument()
    expect(getAuthSessionAdapter()?.getAccessToken()).toBeNull()
    expect(authService.me).not.toHaveBeenCalled()
    await waitFor(() => expect(authService.logout).toHaveBeenCalledOnce())
  })

  it('unregisters the adapter and invalidates pending work on unmount', async () => {
    const pendingRefresh = deferred<{ accessToken: string }>()
    vi.mocked(authService.refresh).mockReturnValue(pendingRefresh.promise)
    const view = renderAuth()
    expect(getAuthSessionAdapter()).not.toBeNull()
    view.unmount()
    await act(async () => pendingRefresh.resolve({ accessToken: 'late-token' }))
    expect(getAuthSessionAdapter()).toBeNull()
  })
})
