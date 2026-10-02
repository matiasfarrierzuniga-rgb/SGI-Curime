import type { AffiliationFormValues } from './affiliation.schema'

export function mapAffiliationFormToRequest(form: AffiliationFormValues) {
  const optional = (value: string) => value.trim() || undefined
  return {
    identificationType: form.identificationType,
    identification: form.identification.trim(),
    firstName: form.firstName.trim(),
    firstSurname: form.firstSurname.trim(),
    birthDate: new Date(`${form.birthDate}T12:00:00`).toISOString(),
    address: form.address.trim(),
    affiliationReason: form.affiliationReason.trim(),
    ...(optional(form.secondSurname) ? { secondSurname: form.secondSurname.trim() } : {}),
    ...(optional(form.gender) ? { gender: form.gender.trim() } : {}),
    ...(optional(form.phoneCountryCode) && optional(form.phoneNationalNumber) ? { phoneCountryCode: form.phoneCountryCode.trim(), phoneNationalNumber: form.phoneNationalNumber.trim() } : {}),
    ...(optional(form.email) ? { email: form.email.trim().toLowerCase() } : {}),
    ...(optional(form.occupation) ? { occupation: form.occupation.trim() } : {}),
    ...(optional(form.workplace) ? { workplace: form.workplace.trim() } : {}),
  }
}
