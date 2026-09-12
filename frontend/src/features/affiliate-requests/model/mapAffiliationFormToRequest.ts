import type { AffiliationFormValues } from './affiliation.schema'

export function mapAffiliationFormToRequest(form: AffiliationFormValues) {
  const optional = (value: string) => value.trim() || undefined
  return {
    birthDate: new Date(`${form.birthDate}T12:00:00`).toISOString(),
    address: form.address.trim(),
    affiliationReason: form.affiliationReason.trim(),
    ...(optional(form.gender) ? { gender: form.gender.trim() } : {}),
    ...(optional(form.occupation) ? { occupation: form.occupation.trim() } : {}),
    ...(optional(form.workplace) ? { workplace: form.workplace.trim() } : {}),
  }
}
