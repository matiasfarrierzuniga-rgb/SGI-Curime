import { z } from 'zod'

const optionalText = (max: number) => z.string().trim().max(max, `Use máximo ${max} caracteres.`)

export const institutionalProfileSchema = z.object({
  legalName: optionalText(200),
  legalIdentification: optionalText(80),
  dinadecoRegistrationCode: optionalText(80),
  dinadecoRegion: optionalText(150),
  organizationType: z.union([z.literal(''), z.enum(['INTEGRAL', 'SPECIFIC'])]),
  province: optionalText(100),
  canton: optionalText(100),
  district: optionalText(100),
  locality: optionalText(150),
  correspondenceAddress: optionalText(500),
  phone: optionalText(50),
  telefax: optionalText(50),
  email: z.union([z.literal(''), z.string().trim().email('Correo electrónico inválido.').max(254, 'Use máximo 254 caracteres.')]),
})

export type InstitutionalProfileFormValues = z.infer<typeof institutionalProfileSchema>
