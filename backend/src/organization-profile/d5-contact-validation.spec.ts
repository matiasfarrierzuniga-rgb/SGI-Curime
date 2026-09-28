import type { CanonicalOrganizationProfileInput } from './organization-profile-input.config';
import {
  CANONICAL_NOTIFICATION_EMAIL_MAX_LENGTH,
  CANONICAL_NOTIFICATION_FAX_MAX_LENGTH,
  CANONICAL_NOTIFICATION_PHONE_MAX_LENGTH,
  validateD5Contacts,
} from './d5-contact-validation';

const canonicalInput = (
  overrides: Partial<CanonicalOrganizationProfileInput> = {},
): CanonicalOrganizationProfileInput => ({
  legalName: 'synthetic-legal-name',
  legalIdentification: 'synthetic-legal-identification',
  dinadecoRegistrationCode: 'synthetic-registration-code',
  organizationType: 'synthetic-organization-type',
  region: 'synthetic-region',
  province: 'synthetic-province',
  canton: 'synthetic-canton',
  district: 'synthetic-district',
  physicalAddress: 'synthetic-physical-address',
  notificationPhone: 'synthetic-phone',
  notificationFax: 'synthetic-fax',
  notificationEmail: 'synthetic@example.test',
  ...overrides,
});

const validate = (
  overrides: Partial<Parameters<typeof validateD5Contacts>[0]> = {},
) =>
  validateD5Contacts({
    phone: 'synthetic-phone',
    telefax: 'synthetic-fax',
    email: 'synthetic@example.test',
    canonicalInput: canonicalInput(),
    ...overrides,
  });

describe('D5 contact validation', () => {
  it('accepts exact, case-sensitive values after trim normalization', () => {
    expect(
      validate({
        phone: '  synthetic-phone  ',
        telefax: '  synthetic-fax  ',
        email: '  synthetic@example.test  ',
        canonicalInput: canonicalInput({
          notificationPhone: ' synthetic-phone ',
          notificationFax: ' synthetic-fax ',
          notificationEmail: ' synthetic@example.test ',
        }),
      }),
    ).toEqual({ decision: 'ACCEPT', codes: [] });
  });

  it.each([null, 42, '   '])('blocks missing, nonstring, or blank legacy phone %p', (phone) => {
    expect(validate({ phone })).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['CONTACT_PHONE_MISSING_OR_BLANK'],
    });
  });

  it.each([null, 42, '   '])('defensively blocks invalid canonical phone %p', (notificationPhone) => {
    expect(
      validate({
        canonicalInput: canonicalInput({
          notificationPhone: notificationPhone as string,
        }),
      }),
    ).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['CONTACT_PHONE_MISSING_OR_BLANK'],
    });
  });

  it('blocks phone values over canonical bound without adding conflict noise', () => {
    expect(
      validate({ phone: 'p'.repeat(CANONICAL_NOTIFICATION_PHONE_MAX_LENGTH + 1) }),
    ).toEqual({ decision: 'BLOCK_CUTOVER', codes: ['CONTACT_PHONE_BOUND_EXCEEDED'] });
    expect(
      validate({
        canonicalInput: canonicalInput({
          notificationPhone: 'p'.repeat(CANONICAL_NOTIFICATION_PHONE_MAX_LENGTH + 1),
        }),
      }),
    ).toEqual({ decision: 'BLOCK_CUTOVER', codes: ['CONTACT_PHONE_BOUND_EXCEEDED'] });
  });

  it('blocks exact phone conflicts', () => {
    expect(validate({ phone: 'different-synthetic-phone' })).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['CONTACT_PHONE_CONFLICT'],
    });
  });

  it('accepts null fax and normalizes whitespace-only legacy fax to null', () => {
    expect(
      validate({ telefax: null, canonicalInput: canonicalInput({ notificationFax: null }) }),
    ).toEqual({ decision: 'ACCEPT', codes: [] });
    expect(
      validate({ telefax: '   ', canonicalInput: canonicalInput({ notificationFax: null }) }),
    ).toEqual({ decision: 'ACCEPT', codes: [] });
  });

  it('blocks unconfirmed or conflicting fax values', () => {
    expect(validate({ telefax: 'synthetic-fax', canonicalInput: canonicalInput({ notificationFax: null }) })).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['CONTACT_FAX_CONFLICT'],
    });
    expect(validate({ telefax: null })).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['CONTACT_FAX_CONFLICT'],
    });
    expect(validate({ telefax: 'different-synthetic-fax' })).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['CONTACT_FAX_CONFLICT'],
    });
  });

  it('blocks blank or oversized nonnull canonical fax without conflict noise', () => {
    expect(
      validate({ canonicalInput: canonicalInput({ notificationFax: '   ' }) }),
    ).toEqual({ decision: 'BLOCK_CUTOVER', codes: ['CONTACT_FAX_CONFLICT'] });
    expect(
      validate({ telefax: 'f'.repeat(CANONICAL_NOTIFICATION_FAX_MAX_LENGTH + 1) }),
    ).toEqual({ decision: 'BLOCK_CUTOVER', codes: ['CONTACT_FAX_BOUND_EXCEEDED'] });
    expect(
      validate({
        canonicalInput: canonicalInput({
          notificationFax: 'f'.repeat(CANONICAL_NOTIFICATION_FAX_MAX_LENGTH + 1),
        }),
      }),
    ).toEqual({ decision: 'BLOCK_CUTOVER', codes: ['CONTACT_FAX_BOUND_EXCEEDED'] });
  });

  it.each([null, 42, '   '])('blocks missing, nonstring, or blank legacy email %p', (email) => {
    expect(validate({ email })).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['CONTACT_EMAIL_MISSING_OR_BLANK'],
    });
  });

  it.each([null, 42, '   '])('defensively blocks invalid canonical email %p', (notificationEmail) => {
    expect(
      validate({
        canonicalInput: canonicalInput({
          notificationEmail: notificationEmail as string,
        }),
      }),
    ).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['CONTACT_EMAIL_MISSING_OR_BLANK'],
    });
  });

  it('blocks email values over canonical bound without adding conflict noise', () => {
    expect(
      validate({ email: 'e'.repeat(CANONICAL_NOTIFICATION_EMAIL_MAX_LENGTH + 1) }),
    ).toEqual({ decision: 'BLOCK_CUTOVER', codes: ['CONTACT_EMAIL_BOUND_EXCEEDED'] });
    expect(
      validate({
        canonicalInput: canonicalInput({
          notificationEmail: 'e'.repeat(CANONICAL_NOTIFICATION_EMAIL_MAX_LENGTH + 1),
        }),
      }),
    ).toEqual({ decision: 'BLOCK_CUTOVER', codes: ['CONTACT_EMAIL_BOUND_EXCEEDED'] });
  });

  it('blocks case-only email mismatches', () => {
    expect(validate({ email: 'SYNTHETIC@example.test' })).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['CONTACT_EMAIL_CONFLICT'],
    });
  });

  it('returns no raw contact values', () => {
    const result = validate({
      phone: 'raw-phone-should-not-return',
      telefax: 'raw-fax-should-not-return',
      email: 'raw-email-should-not-return@example.test',
    });
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('raw-phone-should-not-return');
    expect(serialized).not.toContain('raw-fax-should-not-return');
    expect(serialized).not.toContain('raw-email-should-not-return@example.test');
  });
});
