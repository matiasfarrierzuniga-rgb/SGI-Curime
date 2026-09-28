import {
  D1_REGION_ATTESTATION_ENV,
  loadD1RegionAttestation,
} from './d1-region-attestation.config';

const environmentVariables = Object.values(D1_REGION_ATTESTATION_ENV);

describe('D1 region attestation config', () => {
  const originalEnvironment = new Map(
    environmentVariables.map((name) => [name, process.env[name]]),
  );

  beforeEach(() => {
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

  it.each([undefined, '', '   ', 'false', 'TRUE', 'synthetic-value'])(
    'rejects invalid attestation %p',
    (value) => {
      const name = D1_REGION_ATTESTATION_ENV.attested;
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;

      expect(() => loadD1RegionAttestation()).toThrow(name);
    },
  );

  it.each([undefined, '', '   '])(
    'rejects missing or blank authority reference %p',
    (value) => {
      const name = D1_REGION_ATTESTATION_ENV.authorityReference;
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;

      expect(() => loadD1RegionAttestation()).toThrow(name);
    },
  );

  it('accepts exact true and returns a trimmed authority reference', () => {
    process.env[D1_REGION_ATTESTATION_ENV.authorityReference] =
      '  synthetic-authority-reference  ';

    expect(loadD1RegionAttestation()).toEqual({
      attested: true,
      authorityReference: 'synthetic-authority-reference',
    });
  });
});
