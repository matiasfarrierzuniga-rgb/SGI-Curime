import {
  isUserReconciliationCandidate,
  toSource,
} from './reconciliation-source-adapter';

describe('reconciliation source adapter', () => {
  it('excludes an unlinked email-only account without asserted identity name', () => {
    expect(
      isUserReconciliationCandidate({ personId: null, fullName: null }),
    ).toBe(false);
    expect(
      isUserReconciliationCandidate({ personId: null, fullName: '   ' }),
    ).toBe(false);
  });

  it('preserves nullable fullName without synthesizing identity data', () => {
    expect(
      toSource(
        {
          id: 7,
          identification: null,
          identificationType: null,
          fullName: null,
          email: 'community@example.test',
          phoneCountryCode: null,
          phoneNationalNumber: null,
          address: null,
        },
        'User',
        null,
      ),
    ).toMatchObject({ sourceModel: 'User', sourceId: 7, fullName: null });
  });

  it('retains linked or named legacy accounts as reconciliation candidates', () => {
    expect(
      isUserReconciliationCandidate({ personId: 8, fullName: null }),
    ).toBe(true);
    expect(
      isUserReconciliationCandidate({ personId: null, fullName: 'Ana Pérez' }),
    ).toBe(true);
  });
});
