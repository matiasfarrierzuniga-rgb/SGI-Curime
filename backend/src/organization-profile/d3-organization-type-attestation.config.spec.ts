import {
  D3_ORGANIZATION_TYPE_ATTESTATION_ENV,
  loadD3OrganizationTypeAttestation,
} from './d3-organization-type-attestation.config';

const environmentVariables = Object.values(D3_ORGANIZATION_TYPE_ATTESTATION_ENV);

describe('D3 organization-type attestation config', () => {
  const originalEnvironment = new Map(
    environmentVariables.map((name) => [name, process.env[name]]),
  );

  beforeEach(() => {
    process.env[D3_ORGANIZATION_TYPE_ATTESTATION_ENV.attested] = 'true';
    process.env[D3_ORGANIZATION_TYPE_ATTESTATION_ENV.authorityReference] =
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
      const name = D3_ORGANIZATION_TYPE_ATTESTATION_ENV.attested;
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;

      expect(() => loadD3OrganizationTypeAttestation()).toThrow(name);
    },
  );

  it.each([undefined, '', '   '])(
    'rejects missing or blank authority reference %p',
    (value) => {
      const name = D3_ORGANIZATION_TYPE_ATTESTATION_ENV.authorityReference;
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;

      expect(() => loadD3OrganizationTypeAttestation()).toThrow(name);
    },
  );

  it('accepts trimmed true and returns a trimmed authority reference', () => {
    process.env[D3_ORGANIZATION_TYPE_ATTESTATION_ENV.attested] = ' true ';
    process.env[D3_ORGANIZATION_TYPE_ATTESTATION_ENV.authorityReference] =
      '  synthetic-authority-reference  ';

    expect(loadD3OrganizationTypeAttestation()).toEqual({
      attested: true,
      authorityReference: 'synthetic-authority-reference',
    });
  });
});
