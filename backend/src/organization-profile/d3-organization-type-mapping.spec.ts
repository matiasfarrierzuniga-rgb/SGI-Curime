import {
  mapD3CanonicalOrganizationTypeToLegacy,
  mapD3LegacyOrganizationTypeToCanonical,
} from './d3-organization-type-mapping';

describe('D3 organization-type mappings', () => {
  it.each([
    ['INTEGRAL', 'Asociación de Desarrollo Integral'],
    ['SPECIFIC', 'Asociación de Desarrollo Específica'],
  ])('maps legacy %s to exact canonical text', (legacy, canonical) => {
    expect(mapD3LegacyOrganizationTypeToCanonical(legacy)).toBe(canonical);
  });

  it.each([
    ['Asociación de Desarrollo Integral', 'INTEGRAL'],
    ['Asociación de Desarrollo Específica', 'SPECIFIC'],
  ])('maps exact canonical text %s to legacy enum', (canonical, legacy) => {
    expect(mapD3CanonicalOrganizationTypeToLegacy(canonical)).toBe(legacy);
  });

  it.each([
    null,
    '',
    ' integral ',
    'INTEGRAL ',
    'Asociacion de Desarrollo Integral',
    'asociación de desarrollo integral',
    'synthetic-organization-type',
  ])('rejects non-exact mapping values %p', (value) => {
    expect(mapD3LegacyOrganizationTypeToCanonical(value)).toBeNull();
    expect(mapD3CanonicalOrganizationTypeToLegacy(value)).toBeNull();
  });
});
