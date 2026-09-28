export const D3_ORGANIZATION_TYPE_ATTESTATION_ENV = {
  attested: 'DB1_D3_ORGANIZATION_TYPE_ATTESTED',
  authorityReference: 'DB1_D3_ORGANIZATION_TYPE_AUTHORITY_REFERENCE',
} as const;

export interface D3OrganizationTypeAttestation {
  attested: boolean;
  authorityReference: string | null;
}

export interface ValidD3OrganizationTypeAttestation {
  attested: true;
  authorityReference: string;
}

/** Loads explicit D3 authority evidence. No default evidence is accepted. */
export function loadD3OrganizationTypeAttestation(): ValidD3OrganizationTypeAttestation {
  const attested = process.env[D3_ORGANIZATION_TYPE_ATTESTATION_ENV.attested]?.trim();
  if (attested !== 'true') {
    throw new Error(
      `${D3_ORGANIZATION_TYPE_ATTESTATION_ENV.attested} must be configured as true.`,
    );
  }

  const authorityReference = process.env[
    D3_ORGANIZATION_TYPE_ATTESTATION_ENV.authorityReference
  ]?.trim();
  if (!authorityReference) {
    throw new Error(
      `${D3_ORGANIZATION_TYPE_ATTESTATION_ENV.authorityReference} must be configured with a nonblank value.`,
    );
  }

  return { attested: true, authorityReference };
}
