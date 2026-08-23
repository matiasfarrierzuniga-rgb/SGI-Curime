import type { AuthenticatedUser } from '../types/auth'

const KEY = 'sgi-curime-session'
export interface StoredSession { token: string; user: AuthenticatedUser }

export const sessionStorageService = {
  get(): StoredSession | null {
    try { const value = localStorage.getItem(KEY); return value ? JSON.parse(value) as StoredSession : null } catch { return null }
  },
  set(session: StoredSession) { localStorage.setItem(KEY, JSON.stringify(session)) },
  clear() { localStorage.removeItem(KEY) },
}
