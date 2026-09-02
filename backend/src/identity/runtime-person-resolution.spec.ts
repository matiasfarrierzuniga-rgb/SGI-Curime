import {
  evaluatePersonCompatibility,
  prepareRuntimePersonIdentity,
  type PreparedRuntimePersonIdentity,
  type RuntimePersonIdentityInput,
  type RuntimePersonRecord,
} from './runtime-person-resolution';

const input = (
  overrides: Partial<RuntimePersonIdentityInput> = {},
): RuntimePersonIdentityInput => ({
  identificationType: 'NATIONAL',
  identification: '123456789',
  firstName: 'Ana María',
  firstSurname: 'Rodríguez',
  secondSurname: 'Mora',
  phoneCountryCode: null,
  phoneNationalNumber: null,
  address: null,
  ...overrides,
});

const prepared = (
  overrides: Partial<PreparedRuntimePersonIdentity> = {},
): PreparedRuntimePersonIdentity => ({
  identificationType: 'NATIONAL',
  identification: '123456789',
  normalizedIdentification: '123456789',
  firstName: 'Ana María',
  firstSurname: 'Rodríguez',
  secondSurname: 'Mora',
  phoneCountryCode: null,
  phoneNationalNumber: null,
  address: null,
  ...overrides,
});

const person = (
  overrides: Partial<RuntimePersonRecord> = {},
): RuntimePersonRecord => ({
  id: 1,
  firstName: 'Ana María',
  firstSurname: 'Rodríguez',
  secondSurname: 'Mora',
  identification: '123456789',
  identificationType: 'NATIONAL',
  normalizedIdentification: '123456789',
  ...overrides,
});

describe('runtime Person identity contract', () => {
  it.each([
    ['identificationType', { identificationType: null }],
    ['identification', { identification: '' }],
    ['firstName', { firstName: null }],
    ['firstSurname', { firstSurname: '  ' }],
  ] as const)('reports missing %s as incomplete', (field, override) => {
    expect(prepareRuntimePersonIdentity(input(override))).toEqual({
      status: 'IDENTITY_INCOMPLETE',
      missingFields: [field],
    });
  });

  it('rejects unsupported identification type without inference', () => {
    expect(
      prepareRuntimePersonIdentity(input({ identificationType: 'PASSPORT' })),
    ).toEqual({
      status: 'INVALID_IDENTIFICATION',
      reason: 'UNSUPPORTED_IDENTIFICATION_TYPE',
    });
  });

  it('rejects invalid v1 identification normalization', () => {
    expect(
      prepareRuntimePersonIdentity(input({ identification: '123' })),
    ).toEqual({
      status: 'INVALID_IDENTIFICATION',
      reason: 'INVALID_IDENTIFICATION',
    });
  });

  it('normalizes identity deterministically with v1', () => {
    expect(
      prepareRuntimePersonIdentity(
        input({ identification: ' 123456789 ', firstName: ' Ana María ' }),
      ),
    ).toEqual({ status: 'VALID', identity: prepared() });
  });

  it('accepts omitted optional second surname', () => {
    expect(
      prepareRuntimePersonIdentity(input({ secondSurname: undefined })),
    ).toEqual({
      status: 'VALID',
      identity: prepared({ secondSurname: null }),
    });
  });

  it('rejects invalid structured name components', () => {
    expect(
      prepareRuntimePersonIdentity(
        input({ firstName: '123', secondSurname: 'Mora_2' }),
      ),
    ).toEqual({
      status: 'INVALID_STRUCTURED_NAME',
      invalidFields: ['firstName', 'secondSurname'],
    });
  });

  it('does not accept fullName as structured identity input', () => {
    expect(
      prepareRuntimePersonIdentity({
        identificationType: 'NATIONAL',
        identification: '123456789',
        fullName: 'Ana María Rodríguez Mora',
      } as RuntimePersonIdentityInput),
    ).toEqual({
      status: 'IDENTITY_INCOMPLETE',
      missingFields: ['firstName', 'firstSurname'],
    });
  });

  it('treats case and repeated whitespace as technical equivalents', () => {
    expect(
      evaluatePersonCompatibility(
        person({ firstName: 'ANA   MARÍA' }),
        prepared(),
      ),
    ).toEqual({ status: 'COMPATIBLE', profileEnrichmentRequired: false });
  });

  it('allows omitted input second surname without deleting existing value', () => {
    expect(
      evaluatePersonCompatibility(person(), prepared({ secondSurname: null })),
    ).toEqual({ status: 'COMPATIBLE', profileEnrichmentRequired: false });
  });

  it('marks null existing components for explicit enrichment', () => {
    expect(
      evaluatePersonCompatibility(
        person({ firstName: null, secondSurname: null }),
        prepared(),
      ),
    ).toEqual({ status: 'COMPATIBLE', profileEnrichmentRequired: true });
  });

  it('reports contradictory structured names without fuzzy matching', () => {
    expect(
      evaluatePersonCompatibility(
        person({ firstName: 'Elena', secondSurname: 'Vega' }),
        prepared(),
      ),
    ).toEqual({
      status: 'IDENTITY_CONFLICT',
      conflictFields: ['firstName', 'secondSurname'],
    });
  });
});
