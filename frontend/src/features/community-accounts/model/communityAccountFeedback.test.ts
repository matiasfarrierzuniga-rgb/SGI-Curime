import { describe, expect, it } from 'vitest'
import { communityAccountFeedback, communityFeedbackMessages, communityPasswordError } from './communityAccountFeedback'

function axiosError(status?: number, message?: string) {
  return status
    ? { isAxiosError: true, response: { status, data: { message } } }
    : { isAxiosError: true, request: {} }
}

describe('community account feedback', () => {
  it('keeps identifiable password validation inline and Spanish', () => {
    expect(communityPasswordError('password123')).toBe(communityFeedbackMessages.passwordUppercase)
    expect(communityAccountFeedback(axiosError(400, 'password must contain an uppercase letter'), 'register')).toEqual({
      kind: 'error', field: 'password', message: communityFeedbackMessages.passwordUppercase,
    })
  })

  it('maps expired and unavailable verification tokens without exposing backend text', () => {
    expect(communityAccountFeedback(axiosError(409, 'El enlace de verificación venció.'), 'verify')).toEqual({
      kind: 'warning', message: communityFeedbackMessages.tokenExpired,
    })
    expect(communityAccountFeedback(axiosError(409, 'El enlace de verificación ya no está disponible.'), 'verify')).toEqual({
      kind: 'warning', message: communityFeedbackMessages.tokenUnavailable,
    })
  })

  it('maps throttling, server failures, and network failures to safe feedback', () => {
    expect(communityAccountFeedback(axiosError(429), 'resend')).toEqual({ kind: 'warning', message: communityFeedbackMessages.throttled })
    expect(communityAccountFeedback(axiosError(500), 'register')).toEqual({ kind: 'error', message: communityFeedbackMessages.unavailable })
    expect(communityAccountFeedback(axiosError(), 'register')).toEqual({ kind: 'error', message: communityFeedbackMessages.network })
  })
})
