import { z } from 'zod'
import { emailError, identificationError, phoneError, structuredNameError } from '@/shared/lib/formValidation'

function nameSchema(required = true) {
  return z.string().trim().max(150, 'No puede superar 150 caracteres.').superRefine((value, context) => {
    const error = structuredNameError(value, required)
    if (error) context.addIssue({ code: 'custom', message: error })
  })
}

function isValidBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function birthDateSchema() {
  return z.string().superRefine((value, context) => {
    if (!value) {
      context.addIssue({ code: 'custom', message: 'La fecha de nacimiento es obligatoria.' })
      return
    }
    if (!isValidBirthDate(value)) {
      context.addIssue({ code: 'custom', message: 'Ingrese una fecha de nacimiento válida.' })
      return
    }

    const [year, month, day] = value.split('-').map(Number)
    const birthDate = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (birthDate > today) context.addIssue({ code: 'custom', message: 'La fecha de nacimiento no puede ser futura.' })
  })
}

export const affiliationSchema = z.object({
  firstName: nameSchema(),
  firstSurname: nameSchema(),
  secondSurname: nameSchema(false),
  identificationType: z.enum(['NATIONAL', 'DIMEX']),
  identification: z.string().trim(),
  birthDate: birthDateSchema(),
  gender: z.string().trim().max(30, 'No puede superar 30 caracteres.'),
  phoneCountryCode: z.string().trim(),
  phoneNationalNumber: z.string().trim(),
  email: z.string().trim().toLowerCase().max(254, 'No puede superar 254 caracteres.').superRefine((value, context) => {
    const error = value ? emailError(value) : ''
    if (error) context.addIssue({ code: 'custom', message: error })
  }),
  address: z.string().trim().min(1, 'Este campo es obligatorio.').max(300, 'No puede superar 300 caracteres.'),
  occupation: z.string().trim().max(100, 'No puede superar 100 caracteres.'),
  workplace: z.string().trim().max(150, 'No puede superar 150 caracteres.'),
  affiliationReason: z.string().trim().min(3, 'Ingrese al menos 3 caracteres.').max(1000, 'No puede superar 1000 caracteres.'),
}).superRefine((values, context) => {
  const identificationErrorMessage = identificationError(values.identificationType, values.identification)
  if (identificationErrorMessage) {
    context.addIssue({ code: 'custom', message: identificationErrorMessage, path: ['identification'] })
  }

  const hasCountryCode = Boolean(values.phoneCountryCode)
  const hasNationalNumber = Boolean(values.phoneNationalNumber)
  if (hasCountryCode !== hasNationalNumber) {
    context.addIssue({ code: 'custom', message: 'Ingrese el código de país y el número de teléfono.', path: ['phoneNationalNumber'] })
    return
  }

  const error = phoneError(values.phoneCountryCode, values.phoneNationalNumber)
  if (error) context.addIssue({ code: 'custom', message: error, path: ['phoneNationalNumber'] })
})

export type AffiliationFormValues = z.infer<typeof affiliationSchema>
