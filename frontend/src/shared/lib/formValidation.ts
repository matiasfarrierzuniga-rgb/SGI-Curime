export type IdentificationType = 'NATIONAL' | 'DIMEX'

export const identificationMaxLength = (type: IdentificationType) => type === 'NATIONAL' ? 9 : 12
export const phoneNationalMaxLength = (countryCode: string) => countryCode === '+506' ? 8 : 14

export const digitsOnly = (value: string, maxLength: number) =>
  value.replace(/\D/g, '').slice(0, maxLength)

export function identificationError(type: IdentificationType, value: string) {
  if (type === 'NATIONAL' && !/^[1-9][0-9]{8}$/.test(value))
    return 'Cédula nacional: debe contener exactamente 9 dígitos y no iniciar en 0.'
  if (type === 'DIMEX' && !/^[0-9]{12}$/.test(value))
    return 'DIMEX: debe contener exactamente 12 dígitos.'
  return ''
}

export function phoneError(countryCode: string, nationalNumber: string) {
  if (!nationalNumber) return ''
  if (!/^\+[1-9][0-9]{0,3}$/.test(countryCode) || !/^\d+$/.test(nationalNumber))
    return 'El teléfono internacional no es válido.'
  if (countryCode === '+506' && nationalNumber.length !== 8)
    return 'Teléfono de Costa Rica: debe contener exactamente 8 dígitos.'
  if (countryCode.slice(1).length + nationalNumber.length > 15)
    return 'El teléfono internacional no puede superar 15 dígitos.'
  return ''
}

export const emailError = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Correo electrónico inválido.'

export const fullNameError = (value: string) =>
  /^(?=.*\p{L})[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u.test(value.trim()) && value.trim().length >= 2
    ? ''
    : 'Ingrese un nombre válido usando letras, espacios, apóstrofes o guiones.'

export const structuredNameError = (value: string, required = true) => {
  if (!value.trim()) return required ? 'Este campo es obligatorio.' : ''
  return fullNameError(value)
}

export const normalizeEmail = (value: string) => value.trim().toLowerCase()
export const normalizeText = (value: string) => value.trim()

export interface PersonContactValues {
  fullName: string
  email: string
  phoneCountryCode?: string
  phoneNationalNumber?: string
}

export function personContactErrors(values: PersonContactValues) {
  return {
    fullName: fullNameError(values.fullName),
    email: emailError(values.email),
    phoneNationalNumber: phoneError(values.phoneCountryCode ?? '', values.phoneNationalNumber ?? ''),
  }
}
