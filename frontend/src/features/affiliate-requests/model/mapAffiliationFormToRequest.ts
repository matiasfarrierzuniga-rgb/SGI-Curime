import type { AffiliationFormValues } from './affiliation.schema'

function optional(value: string) {
  return value || undefined
}

export function mapAffiliationFormToRequest(form: AffiliationFormValues) {
  return {
    firstName: form.firstName,
    firstSurname: form.firstSurname,
    identificationType: form.identificationType,
    identification: form.identification,
    birthDate: new Date(`${form.birthDate}T12:00:00`).toISOString(),
    address: form.address,
    affiliationReason: form.affiliationReason,
    ...(optional(form.secondSurname) ? { secondSurname: form.secondSurname } : {}),
    ...(optional(form.gender) ? { gender: form.gender } : {}),
    ...(optional(form.phoneNationalNumber) ? { phoneCountryCode: form.phoneCountryCode, phoneNationalNumber: form.phoneNationalNumber } : {}),
    ...(optional(form.email) ? { email: form.email } : {}),
    ...(optional(form.occupation) ? { occupation: form.occupation } : {}),
    ...(optional(form.workplace) ? { workplace: form.workplace } : {}),
  }
}
