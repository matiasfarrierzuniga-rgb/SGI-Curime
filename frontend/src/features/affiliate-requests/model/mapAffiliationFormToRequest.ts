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
    ...(optional(form.provinceCode) ? { provinceCode: form.provinceCode.trim() } : {}),
    ...(optional(form.cantonCode) ? { cantonCode: form.cantonCode.trim() } : {}),
    ...(optional(form.districtCode) ? { districtCode: form.districtCode.trim() } : {}),
    ...(optional(form.community) ? { community: form.community.trim() } : {}),
    ...(optional(form.catalogVersion) && optional(form.localityKey) ? { catalogVersion: form.catalogVersion.trim(), localityKey: form.localityKey.trim() } : {}),
    affiliationReason: form.affiliationReason.trim(),
    ...(optional(form.secondSurname) ? { secondSurname: form.secondSurname.trim() } : {}),
    ...(optional(form.gender) ? { gender: form.gender.trim() } : {}),
    ...(optional(form.phoneCountryCode) && optional(form.phoneNationalNumber) ? { phoneCountryCode: form.phoneCountryCode.trim(), phoneNationalNumber: form.phoneNationalNumber.trim() } : {}),
    ...(optional(form.email) ? { email: form.email.trim().toLowerCase() } : {}),
    ...(optional(form.occupation) ? { occupation: form.occupation.trim() } : {}),
    ...(optional(form.workplace) ? { workplace: form.workplace.trim() } : {}),
  }
}
