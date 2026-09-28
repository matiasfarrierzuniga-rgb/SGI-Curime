export const D1_REGION_ATTESTATION_ENV = {
  attested: 'DB1_D1_REGION_ATTESTED',
  authorityReference: 'DB1_D1_REGION_AUTHORITY_REFERENCE',
} as const;

export interface D1RegionAttestation {
  attested: boolean;
  authorityReference: string | null;
}

export interface ValidD1RegionAttestation {
  attested: true;
  authorityReference: string;
}

/**
 * Loads explicit D1 attestation evidence. No default evidence is accepted.
 */
export function loadD1RegionAttestation(): ValidD1RegionAttestation {
  const attested = process.env[D1_REGION_ATTESTATION_ENV.attested]?.trim();
  if (attested !== 'true') {
    throw new Error(
      `${D1_REGION_ATTESTATION_ENV.attested} must be configured as true.`,
    );
  }

  const authorityReference = process.env[
    D1_REGION_ATTESTATION_ENV.authorityReference
  ]?.trim();
  if (!authorityReference) {
    throw new Error(
      `${D1_REGION_ATTESTATION_ENV.authorityReference} must be configured with a nonblank value.`,
    );
  }

  return { attested: true, authorityReference };
}
