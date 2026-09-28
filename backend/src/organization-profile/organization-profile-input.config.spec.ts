import {
  loadCanonicalOrganizationProfileInput,
  ORGANIZATION_PROFILE_INPUT_ENV,
} from './organization-profile-input.config';

const requiredFields = Object.entries(ORGANIZATION_PROFILE_INPUT_ENV).filter(
  ([field]) => field !== 'notificationFax',
) as Array<[Exclude<keyof typeof ORGANIZATION_PROFILE_INPUT_ENV, 'notificationFax'>, string]>;

const environmentVariables = Object.values(ORGANIZATION_PROFILE_INPUT_ENV);

describe('canonical organization profile input config', () => {
  const originalEnvironment = new Map(
    environmentVariables.map((name) => [name, process.env[name]]),
  );

  beforeEach(() => {
    for (const [field, name] of requiredFields) {
      process.env[name] = `synthetic-${field}`;
    }
    process.env[ORGANIZATION_PROFILE_INPUT_ENV.notificationFax] =
      'synthetic-notification-fax';
  });

  afterEach(() => {
    for (const name of environmentVariables) {
      const originalValue = originalEnvironment.get(name);
      if (originalValue === undefined) delete process.env[name];
      else process.env[name] = originalValue;
    }
  });

  it('loads complete typed input from process environment and trims values', () => {
    process.env[ORGANIZATION_PROFILE_INPUT_ENV.legalName] =
      '  synthetic-legal-name  ';
    process.env[ORGANIZATION_PROFILE_INPUT_ENV.notificationFax] =
      '  synthetic-notification-fax  ';

    expect(loadCanonicalOrganizationProfileInput()).toEqual({
      legalName: 'synthetic-legal-name',
      legalIdentification: 'synthetic-legalIdentification',
      dinadecoRegistrationCode: 'synthetic-dinadecoRegistrationCode',
      organizationType: 'synthetic-organizationType',
      region: 'synthetic-region',
      province: 'synthetic-province',
      canton: 'synthetic-canton',
      district: 'synthetic-district',
      physicalAddress: 'synthetic-physicalAddress',
      notificationPhone: 'synthetic-notificationPhone',
      notificationFax: 'synthetic-notification-fax',
      notificationEmail: 'synthetic-notificationEmail',
    });
  });

  it.each(requiredFields)(
    'rejects missing required variable %s',
    (field) => {
      const name = ORGANIZATION_PROFILE_INPUT_ENV[field];
      delete process.env[name];

      expect(() => loadCanonicalOrganizationProfileInput()).toThrow(name);
    },
  );

  it.each(requiredFields)(
    'rejects empty required variable %s',
    (field) => {
      const name = ORGANIZATION_PROFILE_INPUT_ENV[field];
      process.env[name] = '';

      expect(() => loadCanonicalOrganizationProfileInput()).toThrow(name);
    },
  );

  it.each(requiredFields)(
    'rejects whitespace-only required variable %s',
    (field) => {
      const name = ORGANIZATION_PROFILE_INPUT_ENV[field];
      process.env[name] = '   ';

      expect(() => loadCanonicalOrganizationProfileInput()).toThrow(name);
    },
  );

  it.each([undefined, '', '   '])(
    'returns null for absent or blank fax %p',
    (value) => {
      const name = ORGANIZATION_PROFILE_INPUT_ENV.notificationFax;
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;

      expect(loadCanonicalOrganizationProfileInput().notificationFax).toBeNull();
    },
  );

  it('returns a trimmed configured fax', () => {
    process.env[ORGANIZATION_PROFILE_INPUT_ENV.notificationFax] =
      '  synthetic-fax-value  ';

    expect(loadCanonicalOrganizationProfileInput().notificationFax).toBe(
      'synthetic-fax-value',
    );
  });

  it('does not provide a default when required configuration is absent', () => {
    delete process.env[ORGANIZATION_PROFILE_INPUT_ENV.region];

    expect(() => loadCanonicalOrganizationProfileInput()).toThrow(
      ORGANIZATION_PROFILE_INPUT_ENV.region,
    );
  });
});
