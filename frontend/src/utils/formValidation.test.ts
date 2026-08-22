import { describe, expect, it } from 'vitest'
import { digitsOnly, emailError, identificationError, identificationMaxLength, normalizeEmail, personContactErrors, phoneError, phoneNationalMaxLength } from './formValidation'

describe('form validation helpers', () => {
  it('limits national and DIMEX input to digits', () => {
    expect(digitsOnly('12a34567890', 9)).toBe('123456789')
    expect(digitsOnly('1234567890123', 12)).toBe('123456789012')
  })
  it('returns inline identity errors', () => {
    expect(identificationError('NATIONAL', '023456789')).toContain('no iniciar en 0')
    expect(identificationError('DIMEX', '123')).toContain('12 dígitos')
  })
  it('validates phone and email', () => {
    expect(phoneError('+506', '8888a777')).toBeTruthy()
    expect(phoneError('+506', '88887777')).toBe('')
    expect(emailError('invalid')).toBe('Correo electrónico inválido.')
  })
  it('centralizes lengths, normalization and shared person/contact errors', () => {
    expect(identificationMaxLength('NATIONAL')).toBe(9)
    expect(identificationMaxLength('DIMEX')).toBe(12)
    expect(phoneNationalMaxLength('+506')).toBe(8)
    expect(normalizeEmail(' USER@EXAMPLE.COM ')).toBe('user@example.com')
    expect(personContactErrors({ fullName: '123', email: 'bad', phoneCountryCode: '+506', phoneNationalNumber: '12' })).toEqual(expect.objectContaining({ fullName: expect.any(String), email: expect.any(String), phoneNationalNumber: expect.any(String) }))
  })
})
