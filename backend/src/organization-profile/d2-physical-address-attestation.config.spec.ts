import {
  D2_PHYSICAL_ADDRESS_ATTESTATION_ENV,
  loadD2PhysicalAddressAttestation,
} from './d2-physical-address-attestation.config';

const environmentVariables = Object.values(D2_PHYSICAL_ADDRESS_ATTESTATION_ENV);

describe('D2 physical-address attestation config', () => {
  const originalEnvironment = new Map(
    environmentVariables.map((name) => [name, process.env[name]]),
  );

  beforeEach(() => {
    process.env[D2_PHYSICAL_ADDRESS_ATTESTATION_ENV.attested] = 'true';
    process.env[D2_PHYSICAL_ADDRESS_ATTESTATION_ENV.authorityReference] =
      'synthetic-authority-reference';
    process.env[
      D2_PHYSICAL_ADDRESS_ATTESTATION_ENV.correspondenceAddressEquivalent
    ] = 'false';
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
      const name = D2_PHYSICAL_ADDRESS_ATTESTATION_ENV.attested;
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;

      expect(() => loadD2PhysicalAddressAttestation()).toThrow(name);
    },
  );

  it.each([undefined, '', '   '])(
    'rejects missing or blank authority reference %p',
    (value) => {
      const name = D2_PHYSICAL_ADDRESS_ATTESTATION_ENV.authorityReference;
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;

      expect(() => loadD2PhysicalAddressAttestation()).toThrow(name);
    },
  );

  it.each([undefined, '', '   ', 'TRUE', 'FALSE', 'synthetic-value'])(
    'rejects invalid correspondence equivalence %p',
    (value) => {
      const name =
        D2_PHYSICAL_ADDRESS_ATTESTATION_ENV.correspondenceAddressEquivalent;
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;

      expect(() => loadD2PhysicalAddressAttestation()).toThrow(name);
    },
  );

  it.each([
    ['true', true],
    ['false', false],
  ])('accepts trimmed equivalence %s', (equivalence, expected) => {
    process.env[D2_PHYSICAL_ADDRESS_ATTESTATION_ENV.authorityReference] =
      '  synthetic-authority-reference  ';
    process.env[
      D2_PHYSICAL_ADDRESS_ATTESTATION_ENV.correspondenceAddressEquivalent
    ] = `  ${equivalence}  `;

    expect(loadD2PhysicalAddressAttestation()).toEqual({
      attested: true,
      authorityReference: 'synthetic-authority-reference',
      correspondenceAddressEquivalent: expected,
    });
  });
});
