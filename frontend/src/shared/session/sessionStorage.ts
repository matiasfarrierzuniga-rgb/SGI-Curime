const KEY = 'sgi-curime-session'

export function clearLegacySession() {
  try {
    sessionStorage.removeItem(KEY)
    localStorage.removeItem(KEY)
  } catch {
    // Storage may be unavailable; credentials are never written here.
  }
}

export const LEGACY_SESSION_STORAGE_KEY = KEY
