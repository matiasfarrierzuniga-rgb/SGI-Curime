import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authService } from '../api/auth.api'
import type { AuthenticatedUser, LoginCredentials, StoredSession } from './auth.types'
import { sessionStorageService } from '@/shared/session/sessionStorage'

interface AuthValue { user: AuthenticatedUser | null; token: string | null; isAuthenticated: boolean; isLoading: boolean; login: (data: LoginCredentials) => Promise<AuthenticatedUser>; logout: () => Promise<void> }
const AuthContext = createContext<AuthValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const stored = sessionStorageService.get<StoredSession>()
  const [user, setUser] = useState<AuthenticatedUser | null>(stored?.user ?? null)
  const [token, setToken] = useState<string | null>(stored?.token ?? null)
  const [isLoading, setIsLoading] = useState(Boolean(stored?.token))
  const clearLocalSession = useCallback(() => {
    sessionStorageService.clear()
    queryClient.clear()
    setUser(null)
    setToken(null)
  }, [queryClient])
  const logout = useCallback(async () => {
    try { await authService.logout() }
    catch { /* Local cleanup must not depend on logout response. */ }
    finally { clearLocalSession() }
  }, [clearLocalSession])

  useEffect(() => {
    const unauthorized = () => clearLocalSession()
    const tokenRefreshed = (event: Event) => setToken((event as CustomEvent<string>).detail)
    const accessChanged = () => {
      authService.me().then((fresh) => {
        setUser(fresh)
        const current = sessionStorageService.get<StoredSession>()
        if (current) sessionStorageService.set({ ...current, user: fresh })
      }).catch(clearLocalSession)
    }
    window.addEventListener('auth:unauthorized', unauthorized)
    window.addEventListener('auth:token-refreshed', tokenRefreshed)
    window.addEventListener('auth:access-changed', accessChanged)
    if (stored?.token) authService.me().then(fresh => { setUser(fresh); sessionStorageService.set({ token: stored.token, user: fresh }) }).catch(clearLocalSession).finally(() => setIsLoading(false))
    return () => { window.removeEventListener('auth:unauthorized', unauthorized); window.removeEventListener('auth:token-refreshed', tokenRefreshed); window.removeEventListener('auth:access-changed', accessChanged) }
  }, [clearLocalSession, stored?.token])

  const login = async (credentials: LoginCredentials) => {
    const session = await authService.login(credentials)
    sessionStorageService.set({ token: session.accessToken, user: session.user })
    setToken(session.accessToken)
    const fresh = await authService.me()
    sessionStorageService.set({ token: session.accessToken, user: fresh })
    setUser(fresh)
    return fresh
  }
  return <AuthContext.Provider value={{ user, token, isAuthenticated: Boolean(token && user), isLoading, login, logout }}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- hook and provider intentionally share their private context
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider'); return value }
