import {
  createPersonBackfillData,
  normalizeIdentification,
  reconcileIdentitySources,
  type IdentitySource,
} from './identity-reconciliation';

const user = (overrides: Partial<IdentitySource> = {}): IdentitySource => ({
  sourceModel: 'User',
  sourceId: 1,
  identification: '123456789',
  identificationType: 'NATIONAL',
  fullName: 'Ana María Rodríguez Mora',
  birthDate: null,
  email: 'ana@example.test',
  phoneCountryCode: '+506',
  phoneNationalNumber: '88888888',
  address: 'Curime',
  ...overrides,
});

describe('identity reconciliation', () => {
  it('normalizes supported identities deterministically', () => {
    expect(normalizeIdentification('NATIONAL', ' 123456789 ')).toEqual({
      rawIdentification: '123456789',
      identificationType: 'NATIONAL',
      normalizedIdentification: '123456789',
    });
    expect(normalizeIdentification('DIMEX', '123456789012')).toEqual({
      rawIdentification: '123456789012',
      identificationType: 'DIMEX',
      normalizedIdentification: '123456789012',
    });
  });

  it('classifies missing or malformed identity as incomplete', () => {
    const clusters = reconcileIdentitySources([
      user({ identification: null }),
      user({ sourceId: 2, identification: '123' }),
      user({ sourceId: 3, identificationType: null }),
    ]);
    expect(
      clusters.every(
        (cluster) => cluster.classification === 'IDENTITY_INCOMPLETE',
      ),
    ).toBe(true);
    expect(clusters.every((cluster) => !cluster.personCreationAllowed)).toBe(
      true,
    );
  });

  it('creates one safe cluster for compatible User and Affiliate records', () => {
    const clusters = reconcileIdentitySources([
      user(),
      user({
        sourceModel: 'Affiliate',
        sourceId: 2,
        birthDate: new Date('1990-01-01T00:00:00.000Z'),
        email: 'contact@example.test',
      }),
    ]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toMatchObject({
      classification: 'IDENTITY_MATCH',
      personCreationAllowed: true,
      nameReconciliationRequired: true,
    });
    const person = createPersonBackfillData(clusters[0]);
    expect(person).toMatchObject({
      legacyFullName: 'Ana María Rodríguez Mora',
      email: 'contact@example.test',
    });
  });

  it('does not parse legacy full names into structured name fields', () => {
    const cluster = reconcileIdentitySources([user()])[0];
    const person = createPersonBackfillData(cluster);
    expect(person?.legacyFullName).toBe('Ana María Rodríguez Mora');
    expect(person).not.toHaveProperty('firstName');
    expect(person).not.toHaveProperty('firstSurname');
  });

  it('requires manual review for conflicting birth dates', () => {
    const clusters = reconcileIdentitySources([
      user({
        sourceModel: 'Affiliate',
        sourceId: 2,
        birthDate: new Date('1990-01-01'),
      }),
      user({
        sourceModel: 'Affiliate',
        sourceId: 3,
        birthDate: new Date('1991-01-01'),
      }),
    ]);
    expect(clusters[0]).toMatchObject({
      classification: 'IDENTITY_DUPLICATE',
      personCreationAllowed: false,
      reviewRequired: true,
    });
    expect(clusters[0].conflictCodes).toContain('BIRTHDATE_CONFLICT');
  });

  it('does not merge equal email with different identity keys', () => {
    const clusters = reconcileIdentitySources([
      user(),
      user({ sourceId: 2, identification: '223456789' }),
    ]);
    expect(
      clusters.every(
        (cluster) => cluster.classification === 'MANUAL_REVIEW_REQUIRED',
      ),
    ).toBe(true);
    expect(clusters.every((cluster) => !cluster.personCreationAllowed)).toBe(
      true,
    );
  });

  it('does not merge equal raw identification with different types', () => {
    const clusters = reconcileIdentitySources([
      user(),
      user({
        sourceId: 2,
        identificationType: 'DIMEX',
        identification: '123456789',
      }),
    ]);
    expect(
      clusters.every(
        (cluster) => cluster.classification === 'MANUAL_REVIEW_REQUIRED',
      ),
    ).toBe(true);
    expect(clusters.flatMap((cluster) => cluster.conflictCodes)).toContain(
      'RAW_IDENTIFICATION_DIFFERENT_TYPE',
    );
  });

  it('is deterministic for unchanged inputs', () => {
    const sources = [user(), user({ sourceModel: 'Affiliate', sourceId: 2 })];
    expect(reconcileIdentitySources(sources)).toEqual(
      reconcileIdentitySources(sources),
    );
  });
});
