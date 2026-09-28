export type LegacyOrganizationType = 'INTEGRAL' | 'SPECIFIC';

export type CanonicalOrganizationType =
  | 'Asociación de Desarrollo Integral'
  | 'Asociación de Desarrollo Específica';

const LEGACY_TO_CANONICAL: Readonly<
  Record<LegacyOrganizationType, CanonicalOrganizationType>
> = {
  INTEGRAL: 'Asociación de Desarrollo Integral',
  SPECIFIC: 'Asociación de Desarrollo Específica',
};

const CANONICAL_TO_LEGACY: Readonly<
  Record<CanonicalOrganizationType, LegacyOrganizationType>
> = {
  'Asociación de Desarrollo Integral': 'INTEGRAL',
  'Asociación de Desarrollo Específica': 'SPECIFIC',
};

/** Maps only exact approved legacy enum values; no normalization is applied. */
export function mapD3LegacyOrganizationTypeToCanonical(
  organizationType: string | null,
): CanonicalOrganizationType | null {
  if (organizationType === 'INTEGRAL' || organizationType === 'SPECIFIC') {
    return LEGACY_TO_CANONICAL[organizationType];
  }

  return null;
}

/** Maps only exact approved canonical text; no normalization is applied. */
export function mapD3CanonicalOrganizationTypeToLegacy(
  organizationType: string | null,
): LegacyOrganizationType | null {
  if (
    organizationType === 'Asociación de Desarrollo Integral' ||
    organizationType === 'Asociación de Desarrollo Específica'
  ) {
    return CANONICAL_TO_LEGACY[organizationType];
  }

  return null;
}
