import { z } from 'zod'

function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export const affiliationSchema = z.object({
  birthDate: z.string().min(1, 'Este campo es obligatorio.').refine(isCalendarDate, 'Ingrese una fecha válida.').refine((value) => new Date(`${value}T12:00:00Z`) <= new Date(), 'La fecha no puede estar en el futuro.'),
  gender: z.string().trim().max(30),
  address: z.string().trim().min(1, 'Este campo es obligatorio.').max(300),
  occupation: z.string().trim().max(100),
  workplace: z.string().trim().max(150),
  affiliationReason: z.string().trim().min(3, 'Explique brevemente por qué desea afiliarse.').max(1000),
})

export type AffiliationFormValues = z.infer<typeof affiliationSchema>
