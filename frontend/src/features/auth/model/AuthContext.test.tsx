import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import { authService } from '../api/auth.api'
import { sessionStorageService } from '@/shared/session/sessionStorage'

vi.mock('../api/auth.api', () => ({ authService: { me: vi.fn(), login: vi.fn() } }))
const user = { id: 1, fullName: 'Ana', email: 'ana@curime.cr', role: 'Usuario', status: 'ACTIVE' } as any
function Probe() { const auth = useAuth(); return <><span>{auth.isLoading ? 'loading' : 'ready'}</span><span>{auth.user?.fullName ?? 'anonymous'}</span><button onClick={() => void auth.login({ email: 'ana@curime.cr', password: 'not-inspected' }).catch(() => undefined)}>login</button><button onClick={auth.logout}>logout</button></> }
function renderAuth() { const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return { queryClient, ...render(<QueryClientProvider client={queryClient}><AuthProvider><Probe /></AuthProvider></QueryClientProvider>) } }
describe('AuthContext', () => {
  beforeEach(() => { localStorage.clear(); vi.clearAllMocks() })
  it('starts loading and restores the current user from /auth/me', async () => { sessionStorageService.set({ token: 'token', user: { ...user, fullName: 'Old' } }); vi.mocked(authService.me).mockResolvedValue(user); renderAuth(); expect(screen.getByText('loading')).toBeInTheDocument(); await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument()); expect(sessionStorageService.get()?.user.fullName).toBe('Ana') })
  it('clears a failed restoration and reacts to a 401 event', async () => { sessionStorageService.set({ token: 'token', user }); vi.mocked(authService.me).mockRejectedValue(new Error('401')); renderAuth(); await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument()); expect(sessionStorageService.get()).toBeNull(); act(() => window.dispatchEvent(new Event('auth:unauthorized'))); expect(screen.getByText('anonymous')).toBeInTheDocument() })
  it('stores a successful login and clears session data and cache on logout', async () => { vi.mocked(authService.login).mockResolvedValue({ accessToken: 'new-token', user }); const { queryClient, unmount } = renderAuth(); queryClient.setQueryData(['users'], user); fireEvent.click(screen.getByText('login')); await waitFor(() => expect(sessionStorageService.get()).toEqual({ token: 'new-token', user })); fireEvent.click(screen.getByText('logout')); expect(sessionStorageService.get()).toBeNull(); expect(queryClient.getQueryData(['users'])).toBeUndefined(); await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument()); unmount(); renderAuth(); expect(screen.getByText('anonymous')).toBeInTheDocument() })
  it('does not create a session after an incorrect login', async () => { vi.mocked(authService.login).mockRejectedValue(new Error('bad credentials')); renderAuth(); screen.getByText('login').click(); await waitFor(() => expect(authService.login).toHaveBeenCalledOnce()); expect(sessionStorageService.get()).toBeNull() })
})
