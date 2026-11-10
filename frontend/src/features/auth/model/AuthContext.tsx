import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { configureAuthSessionAdapter, type SessionInvalidationReason } from '@/shared/api/authSessionAdapter'
import { clearLegacySession } from '@/shared/session/sessionStorage'
import { authService } from '../api/auth.api'
import type { AuthenticatedUser, LoginCredentials } from './auth.types'

export type SessionPhase = 'initializing' | 'authenticated' | 'anonymous' | 'refresh-failed'

interface AuthValue {
  user: AuthenticatedUser | null
  isAuthenticated: boolean
  isLoading: boolean
  phase: SessionPhase
  login: (data: LoginCredentials) => Promise<AuthenticatedUser>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | undefined>(undefined)

class SupersededSessionOperationError extends Error {
  constructor() {
    super('Session operation superseded')
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const tokenRef = useRef<string | null>(null)
  const epochRef = useRef(0)
  const mountedRef = useRef(false)
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [phase, setPhase] = useState<SessionPhase>('anonymous')

  const isCurrent = useCallback((epoch: number) => mountedRef.current && epoch === epochRef.current, [])

  const clearSession = useCallback((reason: SessionInvalidationReason) => {
    epochRef.current += 1
    tokenRef.current = null
    clearLegacySession()
    void queryClient.cancelQueries()
    queryClient.clear()
    if (mountedRef.current) {
      setUser(null)
      setPhase(reason === 'renewal-failed' ? 'refresh-failed' : 'anonymous')
    }
  }, [queryClient])

  const refreshAccessContext = useCallback(async () => {
    const epoch = epochRef.current
    if (!tokenRef.current) return
    try {
      const fresh = await authService.me()
      if (isCurrent(epoch)) setUser(fresh)
    } catch {
      // A 403 reports authorization scope; it must not end an authenticated session.
    }
  }, [isCurrent])

  const renewAccessToken = useCallback(async () => {
    const epoch = epochRef.current
    const { accessToken } = await authService.refresh()
    if (!isCurrent(epoch)) throw new SupersededSessionOperationError()
    tokenRef.current = accessToken
    return accessToken
  }, [isCurrent])

  useEffect(() => {
    mountedRef.current = true
    clearLegacySession()
    return configureAuthSessionAdapter({
      getAccessToken: () => tokenRef.current,
      getSessionEpoch: () => epochRef.current,
      renewAccessToken,
      invalidateSession: clearSession,
      refreshAccessContext,
    })
  }, [clearSession, refreshAccessContext, renewAccessToken])

  useEffect(() => () => {
    mountedRef.current = false
    epochRef.current += 1
    tokenRef.current = null
  }, [])

  const logout = useCallback(async () => {
    const epoch = epochRef.current
    try {
      await authService.logout()
    } catch {
      // Local cleanup must not depend on logout response.
    } finally {
      if (epoch === epochRef.current) clearSession('logout')
    }
  }, [clearSession])

  const login = useCallback(async (credentials: LoginCredentials) => {
    clearSession('session-replaced')
    const epoch = epochRef.current
    const session = await authService.login(credentials)
    if (!isCurrent(epoch)) throw new SupersededSessionOperationError()

    tokenRef.current = session.accessToken
    const fresh = await authService.me()
    if (!isCurrent(epoch)) throw new SupersededSessionOperationError()

    setUser(fresh)
    setPhase('authenticated')
    return fresh
  }, [clearSession, isCurrent])

  return <AuthContext.Provider value={{ user, isAuthenticated: phase === 'authenticated' && user !== null, isLoading: phase === 'initializing', phase, login, logout }}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- hook and provider intentionally share their private context
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return value
}
