const KEY = 'sgi-curime-session'

function removeLegacySession() { localStorage.removeItem(KEY) }

export const sessionStorageService = {
  get<T>(): T | null {
    try { removeLegacySession(); const value = sessionStorage.getItem(KEY); return value ? JSON.parse(value) as T : null } catch { return null }
  },
  set(session: unknown) { removeLegacySession(); sessionStorage.setItem(KEY, JSON.stringify(session)) },
  clear() { sessionStorage.removeItem(KEY); removeLegacySession() },
}
