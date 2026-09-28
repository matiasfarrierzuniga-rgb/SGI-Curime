import {
  D1_REGION_ATTESTATION_ENV,
  loadD1RegionAttestation,
} from './d1-region-attestation.config';
import { validateD1Region } from './d1-region-validation';
import {
  loadCanonicalOrganizationProfileInput,
  ORGANIZATION_PROFILE_INPUT_ENV,
} from './organization-profile-input.config';

const environmentVariables = [
  ...Object.values(ORGANIZATION_PROFILE_INPUT_ENV),
  ...Object.values(D1_REGION_ATTESTATION_ENV),
];

describe('D1 region validation', () => {
  const originalEnvironment = new Map(
    environmentVariables.map((name) => [name, process.env[name]]),
  );

  beforeEach(() => {
    for (const [field, name] of Object.entries(ORGANIZATION_PROFILE_INPUT_ENV)) {
      process.env[name] = `synthetic-${field}`;
    }
    process.env[ORGANIZATION_PROFILE_INPUT_ENV.region] = 'synthetic-region';
    process.env[D1_REGION_ATTESTATION_ENV.attested] = 'true';
    process.env[D1_REGION_ATTESTATION_ENV.authorityReference] =
      'synthetic-authority-reference';
  });

  afterEach(() => {
    for (const name of environmentVariables) {
      const originalValue = originalEnvironment.get(name);
      if (originalValue === undefined) delete process.env[name];
      else process.env[name] = originalValue;
    }
  });

  function validate(dinadecoRegion: string | null) {
    return validateD1Region({
      dinadecoRegion,
      canonicalInput: loadCanonicalOrganizationProfileInput(),
      attestation: loadD1RegionAttestation(),
    });
  }

  it('accepts an exact legacy region match using passed Task 3.1 input', () => {
    expect(validate('synthetic-region')).toEqual({
      decision: 'ACCEPT',
      codes: [],
    });
  });

  it('blocks a blank legacy region', () => {
    expect(validate('   ')).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['LEGACY_REGION_MISSING'],
    });
  });

  it('blocks a legacy region longer than canonical bound', () => {
    expect(validate('x'.repeat(101))).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['LEGACY_REGION_TOO_LONG', 'REGION_MISMATCH'],
    });
  });

  it('blocks a mismatched legacy region without normalizing it', () => {
    expect(validate(' synthetic-region ')).toEqual({
      decision: 'BLOCK_CUTOVER',
      codes: ['REGION_MISMATCH'],
    });
  });
});
