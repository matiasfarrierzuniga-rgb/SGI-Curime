import type { CanonicalOrganizationProfileInput } from './organization-profile-input.config';
import type { D2PhysicalAddressAttestation } from './d2-physical-address-attestation.config';
import { validateD2PhysicalAddress } from './d2-physical-address-validation';

const canonicalInput = (
  physicalAddress: string,
): CanonicalOrganizationProfileInput => ({
  legalName: 'synthetic-legal-name',
  legalIdentification: 'synthetic-legal-identification',
  dinadecoRegistrationCode: 'synthetic-registration-code',
  organizationType: 'synthetic-organization-type',
  region: 'synthetic-region',
  province: 'synthetic-province',
  canton: 'synthetic-canton',
  district: 'synthetic-district',
  physicalAddress,
  notificationPhone: 'synthetic-phone',
  notificationFax: null,
  notificationEmail: 'synthetic@example.test',
});

const validAttestation = (
  correspondenceAddressEquivalent: boolean,
): D2PhysicalAddressAttestation => ({
  attested: true,
  authorityReference: 'synthetic-authority-reference',
  correspondenceAddressEquivalent,
});

describe('D2 physical-address validation', () => {
  it('accepts independently attested canonical address when equivalence is false', () => {
    expect(
      validateD2PhysicalAddress({
        correspondenceAddress: null,
        canonicalInput: canonicalInput('synthetic-physical-address'),
        attestation: validAttestation(false),
      }),
    ).toEqual({ decision: 'ACCEPT', codes: [] });
  });

  it('does not use legacy correspondence as a source when equivalence is false', () => {
    expect(
      validateD2PhysicalAddress({
        correspondenceAddress: 'different synthetic legacy address',
        canonicalInput: canonicalInput('synthetic-physical-address'),
        attestation: validAttestation(false),
      }),
    ).toEqual({ decision: 'ACCEPT', codes: [] });
  });

  it('blocks missing or oversized canonical address', () => {
    expect(
      validateD2PhysicalAddress({
        correspondenceAddress: null,
        canonicalInput: canonicalInput('   '),
        attestation: validAttestation(false),
      }),
    ).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['CANONICAL_PHYSICAL_ADDRESS_MISSING'],
    });

    expect(
      validateD2PhysicalAddress({
        correspondenceAddress: null,
        canonicalInput: canonicalInput('x'.repeat(501)),
        attestation: validAttestation(false),
      }),
    ).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['CANONICAL_PHYSICAL_ADDRESS_TOO_LONG'],
    });
  });

  it('blocks invalid attestation without exposing address values', () => {
    const result = validateD2PhysicalAddress({
      correspondenceAddress: null,
      canonicalInput: canonicalInput('synthetic-physical-address'),
      attestation: {
        attested: false,
        authorityReference: null,
        correspondenceAddressEquivalent: false,
      },
    });

    expect(result).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['PHYSICAL_ADDRESS_ATTESTATION_INVALID'],
    });
    expect(JSON.stringify(result)).not.toContain('synthetic-physical-address');
  });

  it('requires exact legacy correspondence only when equivalence is true', () => {
    const address = 'synthetic-physical-address';

    expect(
      validateD2PhysicalAddress({
        correspondenceAddress: address,
        canonicalInput: canonicalInput(address),
        attestation: validAttestation(true),
      }),
    ).toEqual({ decision: 'ACCEPT', codes: [] });

    expect(
      validateD2PhysicalAddress({
        correspondenceAddress: '   ',
        canonicalInput: canonicalInput(address),
        attestation: validAttestation(true),
      }),
    ).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['LEGACY_CORRESPONDENCE_ADDRESS_MISSING'],
    });

    expect(
      validateD2PhysicalAddress({
        correspondenceAddress: ` ${address}`,
        canonicalInput: canonicalInput(address),
        attestation: validAttestation(true),
      }),
    ).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['CORRESPONDENCE_ADDRESS_MISMATCH'],
    });
  });
});
