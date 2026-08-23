import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { authService } from '../api/auth.api'
import type { AuthenticatedUser, LoginCredentials, StoredSession } from './auth.types'
import { sessionStorageService } from '@/shared/session/sessionStorage'

interface AuthValue { user: AuthenticatedUser | null; token: string | null; isAuthenticated: boolean; isLoading: boolean; login: (data: LoginCredentials) => Promise<AuthenticatedUser>; logout: () => void }
const AuthContext = createContext<AuthValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = sessionStorageService.get<StoredSession>()
  const [user, setUser] = useState<AuthenticatedUser | null>(stored?.user ?? null)
  const [token, setToken] = useState<string | null>(stored?.token ?? null)
  const [isLoading, setIsLoading] = useState(Boolean(stored?.token))
  const logout = useCallback(() => { sessionStorageService.clear(); setUser(null); setToken(null) }, [])

  useEffect(() => {
    const unauthorized = () => logout()
    window.addEventListener('auth:unauthorized', unauthorized)
    if (stored?.token) authService.me().then(fresh => { setUser(fresh); sessionStorageService.set({ token: stored.token, user: fresh }) }).catch(logout).finally(() => setIsLoading(false))
    return () => window.removeEventListener('auth:unauthorized', unauthorized)
  }, [logout, stored?.token])

  const login = async (credentials: LoginCredentials) => {
    const session = await authService.login(credentials)
    sessionStorageService.set({ token: session.accessToken, user: session.user }); setToken(session.accessToken); setUser(session.user)
    return session.user
  }
  return <AuthContext.Provider value={{ user, token, isAuthenticated: Boolean(token && user), isLoading, login, logout }}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- hook and provider intentionally share their private context
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider'); return value }
