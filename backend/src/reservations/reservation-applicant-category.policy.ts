/**
 * Eligibility policy for the applicant category declared on a reservation
 * request. The declared category drives the published tariff, so it must be
 * validated against the requester's own verified affiliation instead of being
 * trusted as a free-text claim.
 *
 * Rules in force:
 * - `PRIVATE`: any authenticated request may use it.
 * - `MEMBERS`: requires an ACTIVE affiliation linked to the requester's
 *   canonical identity (`User.personId` -> `Person.affiliate`).
 * - `GROUPS_COMMITTEES`: rejected until the institution defines a verifiable
 *   rule that can be evaluated from persisted records. No preferential tariff
 *   is ever applied automatically.
 *
 * Rejection messages never disclose the affiliation state of the requester.
 */

export const RESERVATION_APPLICANT_CATEGORIES = [
  'GROUPS_COMMITTEES',
  'MEMBERS',
  'PRIVATE',
] as const;

export type ReservationApplicantCategory =
  (typeof RESERVATION_APPLICANT_CATEGORIES)[number];

export type RequesterAffiliation = {
  hasPerson: boolean;
  affiliateStatus: string | null;
};

export type ApplicantCategoryRejectionReason =
  | 'MEMBERS_REQUIRES_ACTIVE_AFFILIATION'
  | 'GROUPS_COMMITTEES_NOT_AVAILABLE'
  | 'UNKNOWN_CATEGORY';

export type ApplicantCategoryDecision =
  | { allowed: true; category: ReservationApplicantCategory }
  | { allowed: false; reason: ApplicantCategoryRejectionReason };

export const APPLICANT_CATEGORY_REJECTION_MESSAGES: Readonly<
  Record<ApplicantCategoryRejectionReason, string>
> = {
  MEMBERS_REQUIRES_ACTIVE_AFFILIATION:
    'La categoría de solicitante seleccionada no está disponible para esta cuenta.',
  GROUPS_COMMITTEES_NOT_AVAILABLE:
    'La categoría de solicitante seleccionada no está habilitada para solicitudes en este momento.',
  UNKNOWN_CATEGORY:
    'La categoría de solicitante seleccionada no es válida.',
};

export function isReservationApplicantCategory(
  value: string,
): value is ReservationApplicantCategory {
  return (RESERVATION_APPLICANT_CATEGORIES as readonly string[]).includes(value);
}

export function evaluateApplicantCategory(
  category: string,
  affiliation: RequesterAffiliation,
): ApplicantCategoryDecision {
  if (category === 'PRIVATE') {
    return { allowed: true, category: 'PRIVATE' };
  }
  if (category === 'MEMBERS') {
    return affiliation.hasPerson && affiliation.affiliateStatus === 'ACTIVE'
      ? { allowed: true, category: 'MEMBERS' }
      : { allowed: false, reason: 'MEMBERS_REQUIRES_ACTIVE_AFFILIATION' };
  }
  if (category === 'GROUPS_COMMITTEES') {
    return { allowed: false, reason: 'GROUPS_COMMITTEES_NOT_AVAILABLE' };
  }
  return { allowed: false, reason: 'UNKNOWN_CATEGORY' };
}
