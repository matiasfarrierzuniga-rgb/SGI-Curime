import { z } from 'zod'
import {
  identificationError,
  phoneError,
  structuredNameError,
  type IdentificationType,
} from '@/shared/lib/formValidation'

export const createPersonSchema = z.object({
  identificationType: z.enum(['NATIONAL', 'DIMEX']),
  identification: z.string().trim(),
  firstName: z.string().trim().max(150),
  firstSurname: z.string().trim().max(150),
  secondSurname: z.string().trim().max(150),
  phoneCountryCode: z.string().trim().max(5),
  phoneNationalNumber: z.string().trim().max(15),
  address: z.string().trim().max(300),
  reason: z.string().trim().min(5, 'Explique brevemente el motivo administrativo.').max(500),
}).superRefine((values, context) => {
  const identificationMessage = identificationError(
    values.identificationType as IdentificationType,
    values.identification,
  )
  if (identificationMessage) {
    context.addIssue({ code: 'custom', path: ['identification'], message: identificationMessage })
  }

  for (const field of ['firstName', 'firstSurname'] as const) {
    const message = structuredNameError(values[field])
    if (message) context.addIssue({ code: 'custom', path: [field], message })
  }

  const secondSurnameMessage = structuredNameError(values.secondSurname, false)
  if (secondSurnameMessage) {
    context.addIssue({ code: 'custom', path: ['secondSurname'], message: secondSurnameMessage })
  }

  if (values.phoneCountryCode || values.phoneNationalNumber) {
    const phoneMessage = phoneError(values.phoneCountryCode, values.phoneNationalNumber)
      || (!values.phoneCountryCode || !values.phoneNationalNumber
        ? 'Ingrese código de país y número telefónico.'
        : '')
    if (phoneMessage) context.addIssue({ code: 'custom', path: ['phoneNationalNumber'], message: phoneMessage })
  }
})

export type CreatePersonFormValues = z.infer<typeof createPersonSchema>
