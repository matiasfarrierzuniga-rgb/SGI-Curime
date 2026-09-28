import type { CanonicalOrganizationProfileInput } from './organization-profile-input.config';
import type { D3OrganizationTypeAttestation } from './d3-organization-type-attestation.config';
import { validateD3OrganizationType } from './d3-organization-type-validation';

const canonicalInput = (
  organizationType: string,
): CanonicalOrganizationProfileInput => ({
  legalName: 'synthetic-legal-name',
  legalIdentification: 'synthetic-legal-identification',
  dinadecoRegistrationCode: 'synthetic-registration-code',
  organizationType,
  region: 'synthetic-region',
  province: 'synthetic-province',
  canton: 'synthetic-canton',
  district: 'synthetic-district',
  physicalAddress: 'synthetic-physical-address',
  notificationPhone: 'synthetic-phone',
  notificationFax: null,
  notificationEmail: 'synthetic@example.test',
});

const validAttestation: D3OrganizationTypeAttestation = {
  attested: true,
  authorityReference: 'synthetic-authority-reference',
};

describe('D3 organization-type validation', () => {
  it.each([
    ['INTEGRAL', 'Asociación de Desarrollo Integral'],
    ['SPECIFIC', 'Asociación de Desarrollo Específica'],
  ])('accepts exact %s mapping', (legacyOrganizationType, organizationType) => {
    expect(
      validateD3OrganizationType({
        legacyOrganizationType,
        canonicalInput: canonicalInput(organizationType),
        attestation: validAttestation,
      }),
    ).toEqual({ decision: 'ACCEPT', codes: [] });
  });

  it.each([null, '', '   '])('blocks missing legacy type %p', (legacyOrganizationType) => {
    expect(
      validateD3OrganizationType({
        legacyOrganizationType,
        canonicalInput: canonicalInput('Asociación de Desarrollo Integral'),
        attestation: validAttestation,
      }),
    ).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['LEGACY_ORGANIZATION_TYPE_MISSING'],
    });
  });

  it('blocks an unknown runtime legacy type', () => {
    expect(
      validateD3OrganizationType({
        legacyOrganizationType: 'synthetic-unknown-type',
        canonicalInput: canonicalInput('Asociación de Desarrollo Integral'),
        attestation: validAttestation,
      }),
    ).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['LEGACY_ORGANIZATION_TYPE_UNKNOWN'],
    });
  });

  it('blocks invalid attestation without exposing values or references', () => {
    const result = validateD3OrganizationType({
      legacyOrganizationType: 'INTEGRAL',
      canonicalInput: canonicalInput('Asociación de Desarrollo Integral'),
      attestation: { attested: false, authorityReference: null },
    });

    expect(result).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['ORGANIZATION_TYPE_ATTESTATION_INVALID'],
    });
    expect(JSON.stringify(result)).not.toContain('Asociación');
    expect(JSON.stringify(result)).not.toContain('authority');
  });

  it.each([
    ['INTEGRAL', 'Asociación de Desarrollo Específica'],
    ['SPECIFIC', 'Asociación de Desarrollo Integral'],
  ])('blocks cross mapping from %s to %s', (legacyOrganizationType, organizationType) => {
    expect(
      validateD3OrganizationType({
        legacyOrganizationType,
        canonicalInput: canonicalInput(organizationType),
        attestation: validAttestation,
      }),
    ).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['ORGANIZATION_TYPE_MISMATCH'],
    });
  });

  it('blocks arbitrary canonical text as reverse incompatible', () => {
    expect(
      validateD3OrganizationType({
        legacyOrganizationType: 'INTEGRAL',
        canonicalInput: canonicalInput('synthetic-unapproved-canonical-type'),
        attestation: validAttestation,
      }),
    ).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: [
        'ORGANIZATION_TYPE_MISMATCH',
        'ORGANIZATION_TYPE_REVERSE_INCOMPATIBLE',
      ],
    });
  });
});
