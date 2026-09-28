import type {
  D1RegionAttestation,
} from './d1-region-attestation.config';
import type { CanonicalOrganizationProfileInput } from './organization-profile-input.config';

export const CANONICAL_REGION_MAX_LENGTH = 100;

export type D1RegionValidationCode =
  | 'LEGACY_REGION_MISSING'
  | 'LEGACY_REGION_TOO_LONG'
  | 'REGION_MISMATCH'
  | 'REGION_ATTESTATION_INVALID';

export interface D1RegionValidationInput {
  dinadecoRegion: string | null;
  canonicalInput: CanonicalOrganizationProfileInput;
  attestation: D1RegionAttestation;
}

export interface D1RegionValidationResult {
  decision: 'ACCEPT' | 'BLOCK_CUTOVER';
  codes: D1RegionValidationCode[];
}

const VALIDATION_CODE_ORDER: readonly D1RegionValidationCode[] = [
  'LEGACY_REGION_MISSING',
  'LEGACY_REGION_TOO_LONG',
  'REGION_MISMATCH',
  'REGION_ATTESTATION_INVALID',
];

/**
 * Validates D1 without exposing institutional values in its result.
 * Legacy region is accepted only as an exact, explicitly attested match.
 */
export function validateD1Region(
  input: D1RegionValidationInput,
): D1RegionValidationResult {
  const codes = new Set<D1RegionValidationCode>();
  const legacyRegion = input.dinadecoRegion;

  if (typeof legacyRegion !== 'string' || legacyRegion.trim().length === 0) {
    codes.add('LEGACY_REGION_MISSING');
  } else {
    if (legacyRegion.length > CANONICAL_REGION_MAX_LENGTH) {
      codes.add('LEGACY_REGION_TOO_LONG');
    }
    if (legacyRegion !== input.canonicalInput.region) {
      codes.add('REGION_MISMATCH');
    }
  }

  if (!hasValidAttestation(input.attestation)) {
    codes.add('REGION_ATTESTATION_INVALID');
  }

  const orderedCodes = VALIDATION_CODE_ORDER.filter((code) => codes.has(code));
  return {
    decision: orderedCodes.length === 0 ? 'ACCEPT' : 'BLOCK_CUTOVER',
    codes: orderedCodes,
  };
}

function hasValidAttestation(
  attestation: D1RegionAttestation,
): attestation is D1RegionAttestation & {
  attested: true;
  authorityReference: string;
} {
  return (
    attestation.attested === true &&
    typeof attestation.authorityReference === 'string' &&
    attestation.authorityReference.trim().length > 0
  );
}
