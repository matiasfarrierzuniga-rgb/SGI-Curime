import type { CanonicalOrganizationProfileInput } from './organization-profile-input.config';
import type { D2PhysicalAddressAttestation } from './d2-physical-address-attestation.config';

export const CANONICAL_PHYSICAL_ADDRESS_MAX_LENGTH = 500;

export type D2PhysicalAddressValidationCode =
  | 'CANONICAL_PHYSICAL_ADDRESS_MISSING'
  | 'CANONICAL_PHYSICAL_ADDRESS_TOO_LONG'
  | 'PHYSICAL_ADDRESS_ATTESTATION_INVALID'
  | 'LEGACY_CORRESPONDENCE_ADDRESS_MISSING'
  | 'CORRESPONDENCE_ADDRESS_MISMATCH';

export interface D2PhysicalAddressValidationInput {
  correspondenceAddress: string | null;
  canonicalInput: CanonicalOrganizationProfileInput;
  attestation: D2PhysicalAddressAttestation;
}

export interface D2PhysicalAddressValidationResult {
  decision: 'ACCEPT' | 'BLOCK_CUTOVER';
  codes: D2PhysicalAddressValidationCode[];
}

const VALIDATION_CODE_ORDER: readonly D2PhysicalAddressValidationCode[] = [
  'CANONICAL_PHYSICAL_ADDRESS_MISSING',
  'CANONICAL_PHYSICAL_ADDRESS_TOO_LONG',
  'PHYSICAL_ADDRESS_ATTESTATION_INVALID',
  'LEGACY_CORRESPONDENCE_ADDRESS_MISSING',
  'CORRESPONDENCE_ADDRESS_MISMATCH',
];

/**
 * Validates authoritative D2 physical-address input without exposing address
 * values. Legacy correspondence has no independent length bound: when
 * equivalence is attested, exact equality with bounded canonical input is
 * sufficient.
 */
export function validateD2PhysicalAddress(
  input: D2PhysicalAddressValidationInput,
): D2PhysicalAddressValidationResult {
  const codes = new Set<D2PhysicalAddressValidationCode>();
  const canonicalPhysicalAddress = input.canonicalInput.physicalAddress;

  if (
    typeof canonicalPhysicalAddress !== 'string' ||
    canonicalPhysicalAddress.trim().length === 0
  ) {
    codes.add('CANONICAL_PHYSICAL_ADDRESS_MISSING');
  } else if (canonicalPhysicalAddress.length > CANONICAL_PHYSICAL_ADDRESS_MAX_LENGTH) {
    codes.add('CANONICAL_PHYSICAL_ADDRESS_TOO_LONG');
  }

  if (!hasValidAttestation(input.attestation)) {
    codes.add('PHYSICAL_ADDRESS_ATTESTATION_INVALID');
  }

  if (input.attestation.correspondenceAddressEquivalent) {
    const legacyAddress = input.correspondenceAddress;
    if (typeof legacyAddress !== 'string' || legacyAddress.trim().length === 0) {
      codes.add('LEGACY_CORRESPONDENCE_ADDRESS_MISSING');
    } else if (legacyAddress !== canonicalPhysicalAddress) {
      codes.add('CORRESPONDENCE_ADDRESS_MISMATCH');
    }
  }

  const orderedCodes = VALIDATION_CODE_ORDER.filter((code) => codes.has(code));
  return {
    decision: orderedCodes.length === 0 ? 'ACCEPT' : 'BLOCK_CUTOVER',
    codes: orderedCodes,
  };
}

function hasValidAttestation(
  attestation: D2PhysicalAddressAttestation,
): attestation is D2PhysicalAddressAttestation & {
  attested: true;
  authorityReference: string;
} {
  return (
    attestation.attested === true &&
    typeof attestation.authorityReference === 'string' &&
    attestation.authorityReference.trim().length > 0
  );
}
