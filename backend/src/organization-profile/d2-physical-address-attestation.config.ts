export const D2_PHYSICAL_ADDRESS_ATTESTATION_ENV = {
  attested: 'DB1_D2_PHYSICAL_ADDRESS_ATTESTED',
  authorityReference: 'DB1_D2_PHYSICAL_ADDRESS_AUTHORITY_REFERENCE',
  correspondenceAddressEquivalent:
    'DB1_D2_CORRESPONDENCE_ADDRESS_EQUIVALENT',
} as const;

export interface D2PhysicalAddressAttestation {
  attested: boolean;
  authorityReference: string | null;
  correspondenceAddressEquivalent: boolean;
}

export interface ValidD2PhysicalAddressAttestation {
  attested: true;
  authorityReference: string;
  correspondenceAddressEquivalent: boolean;
}

/**
 * Loads explicit D2 authority evidence. No attestation or equivalence default
 * is accepted.
 */
export function loadD2PhysicalAddressAttestation(): ValidD2PhysicalAddressAttestation {
  const attested = process.env[D2_PHYSICAL_ADDRESS_ATTESTATION_ENV.attested]?.trim();
  if (attested !== 'true') {
    throw new Error(
      `${D2_PHYSICAL_ADDRESS_ATTESTATION_ENV.attested} must be configured as true.`,
    );
  }

  const authorityReference = process.env[
    D2_PHYSICAL_ADDRESS_ATTESTATION_ENV.authorityReference
  ]?.trim();
  if (!authorityReference) {
    throw new Error(
      `${D2_PHYSICAL_ADDRESS_ATTESTATION_ENV.authorityReference} must be configured with a nonblank value.`,
    );
  }

  const correspondenceAddressEquivalent = process.env[
    D2_PHYSICAL_ADDRESS_ATTESTATION_ENV.correspondenceAddressEquivalent
  ]?.trim();
  if (
    correspondenceAddressEquivalent !== 'true' &&
    correspondenceAddressEquivalent !== 'false'
  ) {
    throw new Error(
      `${D2_PHYSICAL_ADDRESS_ATTESTATION_ENV.correspondenceAddressEquivalent} must be configured as true or false.`,
    );
  }

  return {
    attested: true,
    authorityReference,
    correspondenceAddressEquivalent: correspondenceAddressEquivalent === 'true',
  };
}
