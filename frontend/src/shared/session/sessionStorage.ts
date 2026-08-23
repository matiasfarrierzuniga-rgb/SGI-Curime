const KEY = 'sgi-curime-session'

export const sessionStorageService = {
  get<T>(): T | null {
    try { const value = localStorage.getItem(KEY); return value ? JSON.parse(value) as T : null } catch { return null }
  },
  set(session: unknown) { localStorage.setItem(KEY, JSON.stringify(session)) },
  clear() { localStorage.removeItem(KEY) },
}
