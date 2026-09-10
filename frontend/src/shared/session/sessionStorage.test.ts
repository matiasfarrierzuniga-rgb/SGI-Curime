import { beforeEach, describe, expect, it } from 'vitest'
import { sessionStorageService } from './sessionStorage'

describe('sessionStorageService', () => {
  beforeEach(() => { sessionStorage.clear(); localStorage.clear() })

  it('stores sessions only for the current browser tab', () => {
    sessionStorageService.set({ token: 'opaque' })
    expect(sessionStorage.getItem('sgi-curime-session')).not.toBeNull()
    expect(localStorage.getItem('sgi-curime-session')).toBeNull()
  })

  it('removes stale legacy localStorage sessions', () => {
    localStorage.setItem('sgi-curime-session', JSON.stringify({ token: 'old' }))
    expect(sessionStorageService.get()).toBeNull()
    expect(localStorage.getItem('sgi-curime-session')).toBeNull()
  })

  it('clears both current and legacy storage', () => {
    sessionStorage.setItem('sgi-curime-session', 'current')
    localStorage.setItem('sgi-curime-session', 'legacy')
    sessionStorageService.clear()
    expect(sessionStorage.getItem('sgi-curime-session')).toBeNull()
    expect(localStorage.getItem('sgi-curime-session')).toBeNull()
  })
})
