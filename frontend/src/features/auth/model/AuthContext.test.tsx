import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAuthSessionAdapter } from '@/shared/api/authSessionAdapter'
import { LEGACY_SESSION_STORAGE_KEY } from '@/shared/session/sessionStorage'
import { AuthProvider, useAuth } from './AuthContext'
import { authService } from '../api/auth.api'

vi.mock('../api/auth.api', () => ({ authService: { me: vi.fn(), login: vi.fn(), logout: vi.fn(), refresh: vi.fn() } }))

const user = { id: 1, fullName: 'Ana', email: 'ana@curime.cr', role: 'Usuario', status: 'ACTIVE' } as any

function Probe() {
  const auth = useAuth()
  return <>
    <span>{auth.isLoading ? 'loading' : 'ready'}</span>
    <span>phase:{auth.phase}</span>
    <span>{auth.user?.fullName ?? 'anonymous'}</span>
    <button onClick={() => void auth.login({ email: 'ana@curime.cr', password: 'not-inspected' }).catch(() => undefined)}>login</button>
    <button onClick={() => void auth.logout()}>logout</button>
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
    vi.mocked(authService.logout).mockResolvedValue({ message: 'Logged out' })
  })

  it('purges only the legacy session key on mount', async () => {
    sessionStorage.setItem(LEGACY_SESSION_STORAGE_KEY, JSON.stringify({ token: 'legacy', user }))
    sessionStorage.setItem('unrelated', 'keep')
    renderAuth()
    await waitFor(() => expect(sessionStorage.getItem(LEGACY_SESSION_STORAGE_KEY)).toBeNull())
    expect(sessionStorage.getItem('unrelated')).toBe('keep')
    expect(screen.getByText('phase:anonymous')).toBeInTheDocument()
  })

  it('keeps successful login credentials in provider memory only', async () => {
    vi.mocked(authService.login).mockResolvedValue({ accessToken: 'new-token', user })
    vi.mocked(authService.me).mockResolvedValue(user)
    renderAuth()
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
    fireEvent.click(screen.getByText('login'))
    await screen.findByText('Ana')
    queryClient.setQueryData(['sensitive'], user)
    fireEvent.click(screen.getByText('logout'))
    await waitFor(() => expect(screen.getByText('phase:anonymous')).toBeInTheDocument())
    expect(getAuthSessionAdapter()?.getAccessToken()).toBeNull()
    expect(queryClient.getQueryData(['sensitive'])).toBeUndefined()
  })

  it('ignores a late login result after the session epoch changes', async () => {
    const pendingLogin = deferred<{ accessToken: string; user: typeof user }>()
    vi.mocked(authService.login).mockReturnValue(pendingLogin.promise)
    const { queryClient } = renderAuth()
    queryClient.setQueryData(['sensitive'], user)
    fireEvent.click(screen.getByText('login'))
    fireEvent.click(screen.getByText('logout'))
    await waitFor(() => expect(authService.logout).toHaveBeenCalledOnce())
    await act(async () => pendingLogin.resolve({ accessToken: 'stale-token', user }))
    expect(screen.getByText('phase:anonymous')).toBeInTheDocument()
    expect(getAuthSessionAdapter()?.getAccessToken()).toBeNull()
    expect(queryClient.getQueryData(['sensitive'])).toBeUndefined()
  })

  it('delegates transport invalidation to provider session cleanup', async () => {
    vi.mocked(authService.login).mockResolvedValue({ accessToken: 'token', user })
    vi.mocked(authService.me).mockResolvedValue(user)
    const { queryClient } = renderAuth()
    fireEvent.click(screen.getByText('login'))
    await screen.findByText('Ana')
    queryClient.setQueryData(['sensitive'], user)
    act(() => getAuthSessionAdapter()?.invalidateSession('renewal-failed'))
    expect(screen.getByText('anonymous')).toBeInTheDocument()
    expect(screen.getByText('phase:refresh-failed')).toBeInTheDocument()
    expect(getAuthSessionAdapter()?.getAccessToken()).toBeNull()
    expect(queryClient.getQueryData(['sensitive'])).toBeUndefined()
  })

  it('rejects a late renewal after its session epoch is invalidated', async () => {
    const pendingRefresh = deferred<{ accessToken: string }>()
    vi.mocked(authService.login).mockResolvedValue({ accessToken: 'token', user })
    vi.mocked(authService.me).mockResolvedValue(user)
    vi.mocked(authService.refresh).mockReturnValue(pendingRefresh.promise)
    renderAuth()
    fireEvent.click(screen.getByText('login'))
    await screen.findByText('Ana')

    const renewal = getAuthSessionAdapter()!.renewAccessToken()
    const rejectedRenewal = expect(renewal).rejects.toThrow('Session operation superseded')
    act(() => getAuthSessionAdapter()?.invalidateSession('logout'))
    await act(async () => pendingRefresh.resolve({ accessToken: 'late-token' }))

    await rejectedRenewal
    expect(getAuthSessionAdapter()?.getAccessToken()).toBeNull()
    expect(screen.getByText('phase:anonymous')).toBeInTheDocument()
  })
})
