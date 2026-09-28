import type { CanonicalOrganizationProfileInput } from './organization-profile-input.config';
import type { D3OrganizationTypeAttestation } from './d3-organization-type-attestation.config';
import {
  mapD3CanonicalOrganizationTypeToLegacy,
  mapD3LegacyOrganizationTypeToCanonical,
} from './d3-organization-type-mapping';

export type D3OrganizationTypeValidationCode =
  | 'LEGACY_ORGANIZATION_TYPE_MISSING'
  | 'LEGACY_ORGANIZATION_TYPE_UNKNOWN'
  | 'ORGANIZATION_TYPE_ATTESTATION_INVALID'
  | 'ORGANIZATION_TYPE_MISMATCH'
  | 'ORGANIZATION_TYPE_REVERSE_INCOMPATIBLE';

export interface D3OrganizationTypeValidationInput {
  legacyOrganizationType: string | null;
  canonicalInput: CanonicalOrganizationProfileInput;
  attestation: D3OrganizationTypeAttestation;
}

export interface D3OrganizationTypeValidationResult {
  decision: 'ACCEPT' | 'BLOCK_CUTOVER';
  codes: D3OrganizationTypeValidationCode[];
}

const VALIDATION_CODE_ORDER: readonly D3OrganizationTypeValidationCode[] = [
  'LEGACY_ORGANIZATION_TYPE_MISSING',
  'LEGACY_ORGANIZATION_TYPE_UNKNOWN',
  'ORGANIZATION_TYPE_ATTESTATION_INVALID',
  'ORGANIZATION_TYPE_MISMATCH',
  'ORGANIZATION_TYPE_REVERSE_INCOMPATIBLE',
];

/**
 * Validates D3 with caller-provided inputs only. Results contain gate codes,
 * never organization values or authority references.
 */
export function validateD3OrganizationType(
  input: D3OrganizationTypeValidationInput,
): D3OrganizationTypeValidationResult {
  const codes = new Set<D3OrganizationTypeValidationCode>();
  const legacyOrganizationType = input.legacyOrganizationType;

  if (
    typeof legacyOrganizationType !== 'string' ||
    legacyOrganizationType.trim().length === 0
  ) {
    codes.add('LEGACY_ORGANIZATION_TYPE_MISSING');
  } else {
    const expectedCanonical = mapD3LegacyOrganizationTypeToCanonical(
      legacyOrganizationType,
    );

    if (expectedCanonical === null) {
      codes.add('LEGACY_ORGANIZATION_TYPE_UNKNOWN');
    } else if (!hasValidAttestation(input.attestation)) {
      codes.add('ORGANIZATION_TYPE_ATTESTATION_INVALID');
    } else {
      const canonicalOrganizationType = input.canonicalInput.organizationType;
      const reverseLegacy = mapD3CanonicalOrganizationTypeToLegacy(
        canonicalOrganizationType,
      );

      if (canonicalOrganizationType !== expectedCanonical) {
        codes.add('ORGANIZATION_TYPE_MISMATCH');
      }

      if (reverseLegacy === null) {
        codes.add('ORGANIZATION_TYPE_REVERSE_INCOMPATIBLE');
      } else if (reverseLegacy !== legacyOrganizationType) {
        codes.add('ORGANIZATION_TYPE_MISMATCH');
      }
    }
  }

  if (
    !codes.has('LEGACY_ORGANIZATION_TYPE_MISSING') &&
    !codes.has('LEGACY_ORGANIZATION_TYPE_UNKNOWN') &&
    !hasValidAttestation(input.attestation)
  ) {
    codes.add('ORGANIZATION_TYPE_ATTESTATION_INVALID');
  }

  const orderedCodes = VALIDATION_CODE_ORDER.filter((code) => codes.has(code));
  return {
    decision: orderedCodes.length === 0 ? 'ACCEPT' : 'BLOCK_CUTOVER',
    codes: orderedCodes,
  };
}

function hasValidAttestation(
  attestation: D3OrganizationTypeAttestation,
): attestation is D3OrganizationTypeAttestation & {
  attested: true;
  authorityReference: string;
} {
  return (
    attestation.attested === true &&
    typeof attestation.authorityReference === 'string' &&
    attestation.authorityReference.trim().length > 0
  );
}
