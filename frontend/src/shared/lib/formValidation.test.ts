import { describe, expect, it } from 'vitest'
import { digitsOnly, emailError, identificationError, identificationMaxLength, normalizeEmail, normalizeIdentification, normalizePhoneCountryCode, normalizePhoneNationalNumber, personContactErrors, phoneError, phoneNationalMaxLength, phonePairError, structuredNameError } from './formValidation'

describe('form validation helpers', () => {
  it('validates required and optional structured names', () => {
    expect(structuredNameError('')).toBe('Este campo es obligatorio.')
    expect(structuredNameError('', false)).toBe('')
    expect(structuredNameError('Ana María')).toBe('')
    expect(structuredNameError('123')).not.toBe('')
  })
  it('limits national and DIMEX input to digits', () => {
    expect(digitsOnly('12a34567890', 9)).toBe('123456789')
    expect(digitsOnly('1234567890123', 12)).toBe('123456789012')
  })
  it('returns inline identity errors', () => {
    expect(identificationError('NATIONAL', '123456789')).toBe('')
    expect(identificationError('NATIONAL', '023456789')).toContain('no iniciar en 0')
    expect(identificationError('DIMEX', '123')).toContain('12 dígitos')
    expect(identificationError('DIMEX', '123456789012')).toBe('')
    expect(normalizeIdentification('NATIONAL', '1-2345 6789')).toBe('123456789')
    expect(normalizeIdentification('DIMEX', '1234-5678-9012')).toBe('123456789012')
  })
  it('validates phone and email', () => {
    expect(phoneError('+506', '8888a777')).toBeTruthy()
    expect(phoneError('+506', '88887777')).toBe('')
    expect(phoneError('+506', '8888777')).toContain('8 dígitos')
    expect(phoneError('+506', '888877777')).toContain('8 dígitos')
    expect(phoneError('+1', '2125550198')).toBe('')
    expect(phonePairError('+506', '')).toContain('juntos')
    expect(phonePairError('', '')).toBe('')
    expect(normalizePhoneCountryCode(' +506 ')).toBe('+506')
    expect(normalizePhoneNationalNumber('8888 8888')).toBe('88888888')
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
