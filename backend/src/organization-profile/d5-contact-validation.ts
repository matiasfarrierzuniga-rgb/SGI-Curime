import type { CanonicalOrganizationProfileInput } from './organization-profile-input.config';

export const CANONICAL_NOTIFICATION_PHONE_MAX_LENGTH = 40;
export const CANONICAL_NOTIFICATION_FAX_MAX_LENGTH = 40;
export const CANONICAL_NOTIFICATION_EMAIL_MAX_LENGTH = 254;

export type D5ContactValidationCode =
  | 'CONTACT_PHONE_MISSING_OR_BLANK'
  | 'CONTACT_PHONE_BOUND_EXCEEDED'
  | 'CONTACT_PHONE_CONFLICT'
  | 'CONTACT_FAX_BOUND_EXCEEDED'
  | 'CONTACT_FAX_CONFLICT'
  | 'CONTACT_EMAIL_MISSING_OR_BLANK'
  | 'CONTACT_EMAIL_BOUND_EXCEEDED'
  | 'CONTACT_EMAIL_CONFLICT';

export interface D5ContactValidationInput {
  phone: unknown;
  telefax: string | null;
  email: unknown;
  canonicalInput: CanonicalOrganizationProfileInput;
}

export interface D5ContactValidationResult {
  decision: 'ACCEPT' | 'BLOCK_CUTOVER';
  codes: D5ContactValidationCode[];
}

const VALIDATION_CODE_ORDER: readonly D5ContactValidationCode[] = [
  'CONTACT_PHONE_MISSING_OR_BLANK',
  'CONTACT_PHONE_BOUND_EXCEEDED',
  'CONTACT_PHONE_CONFLICT',
  'CONTACT_FAX_BOUND_EXCEEDED',
  'CONTACT_FAX_CONFLICT',
  'CONTACT_EMAIL_MISSING_OR_BLANK',
  'CONTACT_EMAIL_BOUND_EXCEEDED',
  'CONTACT_EMAIL_CONFLICT',
];

/**
 * Validates D5 contact mappings using caller-provided values only. Results
 * contain sanitized field/reason codes and never contact values.
 */
export function validateD5Contacts(
  input: D5ContactValidationInput,
): D5ContactValidationResult {
  const codes = new Set<D5ContactValidationCode>();

  validatePhone(input.phone, input.canonicalInput.notificationPhone, codes);
  validateFax(input.telefax, input.canonicalInput.notificationFax, codes);
  validateEmail(input.email, input.canonicalInput.notificationEmail, codes);

  const orderedCodes = VALIDATION_CODE_ORDER.filter((code) => codes.has(code));
  return {
    decision: orderedCodes.length === 0 ? 'ACCEPT' : 'BLOCK_CUTOVER',
    codes: orderedCodes,
  };
}

function validatePhone(
  legacyPhone: unknown,
  canonicalPhone: unknown,
  codes: Set<D5ContactValidationCode>,
): void {
  const normalizedLegacyPhone = requiredString(legacyPhone);
  const normalizedCanonicalPhone = requiredString(canonicalPhone);

  if (!normalizedLegacyPhone || !normalizedCanonicalPhone) {
    codes.add('CONTACT_PHONE_MISSING_OR_BLANK');
    return;
  }

  if (
    normalizedLegacyPhone.length > CANONICAL_NOTIFICATION_PHONE_MAX_LENGTH ||
    normalizedCanonicalPhone.length > CANONICAL_NOTIFICATION_PHONE_MAX_LENGTH
  ) {
    codes.add('CONTACT_PHONE_BOUND_EXCEEDED');
    return;
  }

  if (normalizedLegacyPhone !== normalizedCanonicalPhone) {
    codes.add('CONTACT_PHONE_CONFLICT');
  }
}

function validateFax(
  legacyFax: string | null,
  canonicalFax: unknown,
  codes: Set<D5ContactValidationCode>,
): void {
  const normalizedLegacyFax = optionalString(legacyFax);
  const normalizedCanonicalFax = optionalString(canonicalFax);

  if (canonicalFax !== null && normalizedCanonicalFax === null) {
    codes.add('CONTACT_FAX_CONFLICT');
    return;
  }

  if (normalizedLegacyFax === null && normalizedCanonicalFax === null) {
    return;
  }

  if (normalizedLegacyFax === null || normalizedCanonicalFax === null) {
    codes.add('CONTACT_FAX_CONFLICT');
    return;
  }

  if (
    normalizedLegacyFax.length > CANONICAL_NOTIFICATION_FAX_MAX_LENGTH ||
    normalizedCanonicalFax.length > CANONICAL_NOTIFICATION_FAX_MAX_LENGTH
  ) {
    codes.add('CONTACT_FAX_BOUND_EXCEEDED');
    return;
  }

  if (normalizedLegacyFax !== normalizedCanonicalFax) {
    codes.add('CONTACT_FAX_CONFLICT');
  }
}

function validateEmail(
  legacyEmail: unknown,
  canonicalEmail: unknown,
  codes: Set<D5ContactValidationCode>,
): void {
  const normalizedLegacyEmail = requiredString(legacyEmail);
  const normalizedCanonicalEmail = requiredString(canonicalEmail);

  if (!normalizedLegacyEmail || !normalizedCanonicalEmail) {
    codes.add('CONTACT_EMAIL_MISSING_OR_BLANK');
    return;
  }

  if (
    normalizedLegacyEmail.length > CANONICAL_NOTIFICATION_EMAIL_MAX_LENGTH ||
    normalizedCanonicalEmail.length > CANONICAL_NOTIFICATION_EMAIL_MAX_LENGTH
  ) {
    codes.add('CONTACT_EMAIL_BOUND_EXCEEDED');
    return;
  }

  if (normalizedLegacyEmail !== normalizedCanonicalEmail) {
    codes.add('CONTACT_EMAIL_CONFLICT');
  }
}

function requiredString(value: unknown): string | null {
  const normalized = optionalString(value);
  return normalized === null ? null : normalized;
}

function optionalString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length === 0 ? null : normalized;
}
