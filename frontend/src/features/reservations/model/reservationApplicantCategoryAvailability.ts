/**
 * Availability of the applicant categories offered by the public reservation
 * request form.
 *
 * `GROUPS_COMMITTEES` stays in the published tariff matrix, but the backend
 * rejects it until the institution defines a verifiable rule that can be
 * evaluated from persisted records. The option therefore remains visible and
 * disabled, with a short notice, instead of silently disappearing or
 * applying a preferential tariff.
 *
 * This module does not alter the published tariffs or any data contract.
 */

export const UNAVAILABLE_APPLICANT_CATEGORIES = ['GROUPS_COMMITTEES'] as const;

export const APPLICANT_CATEGORY_UNAVAILABLE_NOTICE =
  'Esta categoría estará disponible próximamente';

export function isApplicantCategoryAvailable(value: string): boolean {
  return !(UNAVAILABLE_APPLICANT_CATEGORIES as readonly string[]).includes(value);
}

export function applicantCategoryUnavailableNotice(value: string): string | null {
  return isApplicantCategoryAvailable(value)
    ? null
    : APPLICANT_CATEGORY_UNAVAILABLE_NOTICE;
}
