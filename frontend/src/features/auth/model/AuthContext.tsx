import axios from 'axios'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { configureAuthSessionAdapter, type SessionInvalidationReason } from '@/shared/api/authSessionAdapter'
import { createAuthSessionCoordinator, type AuthSessionCoordinator } from '@/shared/session/authSessionCoordinator'
import { clearLegacySession } from '@/shared/session/sessionStorage'
import { authService } from '../api/auth.api'
import type { AuthenticatedUser, ChangePasswordPayload, LoginCredentials } from './auth.types'

export type SessionPhase = 'initializing' | 'authenticated' | 'anonymous' | 'refresh-failed'

interface AuthValue {
  user: AuthenticatedUser | null
  isAuthenticated: boolean
  isLoading: boolean
  phase: SessionPhase
  login: (data: LoginCredentials) => Promise<AuthenticatedUser>
  logout: () => Promise<void>
  changePassword: (payload: ChangePasswordPayload) => Promise<{ message?: string }>
}

const AuthContext = createContext<AuthValue | undefined>(undefined)

class SupersededSessionOperationError extends Error {
  constructor() {
    super('Session operation superseded')
  }
}

function isUnauthorized(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const tokenRef = useRef<string | null>(null)
  const epochRef = useRef(0)
  const mountedRef = useRef(false)
  const coordinatorRef = useRef<AuthSessionCoordinator | null>(null)
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [phase, setPhase] = useState<SessionPhase>('initializing')

  const isCurrent = useCallback((epoch: number) => mountedRef.current && epoch === epochRef.current, [])

  const resetSession = useCallback((nextPhase: Exclude<SessionPhase, 'authenticated'>, clearCache = true) => {
    epochRef.current += 1
    tokenRef.current = null
    clearLegacySession()
    if (clearCache) {
      void queryClient.cancelQueries()
      queryClient.clear()
    }
    if (mountedRef.current) {
      setUser(null)
      setPhase(nextPhase)
    }
    return epochRef.current
  }, [queryClient])

  const clearSession = useCallback((reason: SessionInvalidationReason) => {
    resetSession(reason === 'renewal-failed' ? 'refresh-failed' : 'anonymous')
  }, [resetSession])

  const refreshAccessContext = useCallback(async () => {
    const epoch = epochRef.current
    if (!tokenRef.current) return
    try {
      const fresh = await authService.me()
      if (isCurrent(epoch)) setUser(fresh)
    } catch {
      // A 403 refreshes authorization context only; it does not end the session.
    }
  }, [isCurrent])

  const renewAccessToken = useCallback(async () => {
    const epoch = epochRef.current
    const coordinator = coordinatorRef.current
    const refresh = async () => {
      coordinator?.publish('refresh-started')
      try {
        return await authService.refresh()
      } finally {
        coordinator?.publish('refresh-completed')
      }
    }
    const { accessToken } = coordinator ? await coordinator.runCookieOperation(refresh) : await refresh()
    if (!isCurrent(epoch)) throw new SupersededSessionOperationError()
    tokenRef.current = accessToken
    return accessToken
  }, [isCurrent])

  const recoverSession = useCallback(async (clearCache = true) => {
    const epoch = resetSession('initializing', clearCache)
    try {
      await renewAccessToken()
      const fresh = await authService.me()
      if (!isCurrent(epoch)) throw new SupersededSessionOperationError()
      setUser(fresh)
      setPhase('authenticated')
    } catch (error) {
      if (!isCurrent(epoch) || error instanceof SupersededSessionOperationError) return
      resetSession(isUnauthorized(error) ? 'anonymous' : 'refresh-failed', clearCache)
    }
  }, [isCurrent, renewAccessToken, resetSession])

  useEffect(() => {
    mountedRef.current = true
    return configureAuthSessionAdapter({
      getAccessToken: () => tokenRef.current,
      getSessionEpoch: () => epochRef.current,
      renewAccessToken,
      invalidateSession: clearSession,
      refreshAccessContext,
    })
  }, [clearSession, refreshAccessContext, renewAccessToken])

  useEffect(() => {
    const coordinator = createAuthSessionCoordinator((event) => {
      if (event.type === 'session-invalidated') clearSession('logout')
      if (event.type === 'session-changed') void recoverSession()
    })
    coordinatorRef.current = coordinator
    return () => {
      if (coordinatorRef.current === coordinator) coordinatorRef.current = null
      coordinator.close()
    }
  }, [clearSession, recoverSession])

  useEffect(() => {
    void recoverSession(false)
  }, [recoverSession])

  useEffect(() => () => {
    mountedRef.current = false
    epochRef.current += 1
    tokenRef.current = null
  }, [])

  const logout = useCallback(async () => {
    clearSession('logout')
    coordinatorRef.current?.publish('session-invalidated')
    try {
      const coordinator = coordinatorRef.current
      if (coordinator) await coordinator.runCookieOperation(() => authService.logout())
      else await authService.logout()
    } catch {
      // Local cleanup must not claim backend revocation after a network failure.
    }
  }, [clearSession])

  const login = useCallback(async (credentials: LoginCredentials) => {
    resetSession('anonymous')
    const epoch = epochRef.current
    const coordinator = coordinatorRef.current
    const session = coordinator
      ? await coordinator.runCookieOperation(() => authService.login(credentials))
      : await authService.login(credentials)
    if (!isCurrent(epoch)) throw new SupersededSessionOperationError()

    tokenRef.current = session.accessToken
    const fresh = await authService.me()
    if (!isCurrent(epoch)) throw new SupersededSessionOperationError()

    setUser(fresh)
    setPhase('authenticated')
    coordinatorRef.current?.publish('session-changed')
    return fresh
  }, [isCurrent, resetSession])

  const changePassword = useCallback(async (payload: ChangePasswordPayload) => {
    const epoch = epochRef.current
    const result = await authService.changePassword(payload)
    if (isCurrent(epoch)) {
      resetSession('anonymous')
      coordinatorRef.current?.publish('session-invalidated')
    }
    return result
  }, [isCurrent, resetSession])

  return <AuthContext.Provider value={{ user, isAuthenticated: phase === 'authenticated' && user !== null, isLoading: phase === 'initializing', phase, login, logout, changePassword }}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- hook and provider intentionally share their private context
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return value
}
