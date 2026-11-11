import { beforeEach, describe, expect, it } from 'vitest'
import { clearLegacySession, LEGACY_SESSION_STORAGE_KEY } from './sessionStorage'

describe('clearLegacySession', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('removes only the obsolete authentication key from both storage areas', () => {
    localStorage.setItem(LEGACY_SESSION_STORAGE_KEY, 'legacy-access-token')
    sessionStorage.setItem(LEGACY_SESSION_STORAGE_KEY, 'legacy-access-token')
    localStorage.setItem('unrelated-local', 'keep')
    sessionStorage.setItem('unrelated-session', 'keep')

    clearLegacySession()

    expect(localStorage.getItem(LEGACY_SESSION_STORAGE_KEY)).toBeNull()
    expect(sessionStorage.getItem(LEGACY_SESSION_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem('unrelated-local')).toBe('keep')
    expect(sessionStorage.getItem('unrelated-session')).toBe('keep')
  })
})
