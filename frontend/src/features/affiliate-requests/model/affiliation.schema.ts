import { z } from 'zod'
import { emailError, identificationError, phoneError, type IdentificationType, structuredNameError } from '@/shared/lib/formValidation'

function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export const affiliationSchema = z.object({
  identificationType: z.enum(['NATIONAL', 'DIMEX']),
  identification: z.string().trim(),
  firstName: z.string().trim().max(150),
  firstSurname: z.string().trim().max(150),
  secondSurname: z.string().trim().max(150),
  birthDate: z.string().min(1, 'Este campo es obligatorio.').refine(isCalendarDate, 'Ingrese una fecha válida.').refine((value) => new Date(`${value}T12:00:00Z`) <= new Date(), 'La fecha no puede estar en el futuro.'),
  gender: z.string().trim().max(30),
  phoneCountryCode: z.string().trim().max(5),
  phoneNationalNumber: z.string().trim().max(15),
  email: z.string().trim().max(254),
  address: z.string().trim().min(1, 'Este campo es obligatorio.').max(300),
  occupation: z.string().trim().max(100),
  workplace: z.string().trim().max(150),
  affiliationReason: z.string().trim().min(3, 'Explique brevemente por qué desea afiliarse.').max(1000),
}).superRefine((values, context) => {
  const identificationMessage = identificationError(values.identificationType as IdentificationType, values.identification)
  if (identificationMessage) context.addIssue({ code: 'custom', path: ['identification'], message: identificationMessage })

  for (const field of ['firstName', 'firstSurname'] as const) {
    const message = structuredNameError(values[field])
    if (message) context.addIssue({ code: 'custom', path: [field], message })
  }

  const secondSurnameMessage = structuredNameError(values.secondSurname, false)
  if (secondSurnameMessage) context.addIssue({ code: 'custom', path: ['secondSurname'], message: secondSurnameMessage })

  if (values.phoneCountryCode || values.phoneNationalNumber) {
    const phoneMessage = phoneError(values.phoneCountryCode, values.phoneNationalNumber)
      || (!values.phoneCountryCode || !values.phoneNationalNumber ? 'Ingrese código de país y número telefónico.' : '')
    if (phoneMessage) context.addIssue({ code: 'custom', path: ['phoneNationalNumber'], message: phoneMessage })
  }

  if (values.email && emailError(values.email)) context.addIssue({ code: 'custom', path: ['email'], message: emailError(values.email) })
})

export type AffiliationFormValues = z.infer<typeof affiliationSchema>
