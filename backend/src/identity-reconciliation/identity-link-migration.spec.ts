import {
  buildIdentityLinkPlan,
  type IdentityLinkManifestDecision,
  type IdentityLinkSource,
} from './identity-link-migration';
import { sourceFingerprint } from './identity-reconciliation';

const user = (
  overrides: Partial<IdentityLinkSource> = {},
): IdentityLinkSource => ({
  sourceModel: 'User',
  sourceId: 1,
  personId: null,
  identification: '123456789',
  identificationType: 'NATIONAL',
  fullName: 'Ana Rodríguez',
  birthDate: null,
  email: 'ana@example.test',
  phoneCountryCode: '+506',
  phoneNationalNumber: '88888888',
  address: 'Curime',
  ...overrides,
});

const affiliate = (
  overrides: Partial<IdentityLinkSource> = {},
): IdentityLinkSource => ({
  ...user(),
  sourceModel: 'Affiliate',
  sourceId: 2,
  birthDate: new Date('1990-01-01T00:00:00.000Z'),
  ...overrides,
});

const decision = (
  source: IdentityLinkSource,
  overrides: Partial<IdentityLinkManifestDecision> = {},
): IdentityLinkManifestDecision => ({
  manifestVersion: 'v1',
  sourceModel: source.sourceModel,
  sourceId: source.sourceId,
  sourceFingerprint: sourceFingerprint(source),
  identityClusterKey: `NATIONAL:${source.identification}`,
  classification: 'IDENTITY_NOT_FOUND',
  selectedPersonId: 1,
  personCreationAllowed: true,
  reviewRequired: false,
  ...overrides,
});

describe('identity link migration', () => {
  it('plans safe User and Affiliate links to one shared Person', () => {
    const sources = [user(), affiliate()];
    const plan = buildIdentityLinkPlan(
      sources,
      [decision(sources[0]), decision(sources[1])],
      new Set([1]),
    );

    expect(plan).toMatchObject({
      blocked: false,
      assignments: [
        { sourceModel: 'User', sourceId: 1, personId: 1 },
        { sourceModel: 'Affiliate', sourceId: 2, personId: 1 },
      ],
      preflight: {
        safeUserLinkCandidates: 1,
        safeAffiliateLinkCandidates: 1,
      },
    });
  });

  it('denies manual-review and incomplete sources', () => {
    const manual = user();
    const incomplete = affiliate({ sourceId: 3, identification: null });
    const plan = buildIdentityLinkPlan(
      [manual, incomplete],
      [
        decision(manual, {
          classification: 'MANUAL_REVIEW_REQUIRED',
          reviewRequired: true,
        }),
        decision(incomplete, {
          classification: 'IDENTITY_INCOMPLETE',
          selectedPersonId: null,
          personCreationAllowed: false,
          identityClusterKey: null,
          reviewRequired: true,
        }),
      ],
      new Set([1]),
    );

    expect(plan.blocked).toBe(false);
    expect(plan.assignments).toEqual([]);
    expect(plan.preflight).toMatchObject({
      manualReviewUserSources: 1,
      manualReviewAffiliateSources: 1,
    });
  });

  it('denies stale manifest decisions without recomputing identity ownership', () => {
    const source = user({ email: 'changed@example.test' });
    const staleDecision = decision(source, { sourceFingerprint: 'stale' });
    const plan = buildIdentityLinkPlan([source], [staleDecision], new Set([1]));

    expect(plan.blocked).toBe(false);
    expect(plan.assignments).toEqual([]);
    expect(plan.preflight.staleUserManifestEntries).toBe(1);
  });

  it('blocks missing selected Persons and never creates replacements', () => {
    const source = user();
    const plan = buildIdentityLinkPlan(
      [source],
      [decision(source, { selectedPersonId: 9 })],
      new Set([1]),
    );

    expect(plan.blocked).toBe(true);
    expect(plan.assignments).toEqual([]);
    expect(plan.preflight.missingSelectedPerson).toBe(1);
  });

  it('blocks an incompatible existing link without overwriting it', () => {
    const source = user({ personId: 9 });
    const plan = buildIdentityLinkPlan(
      [source],
      [decision(source)],
      new Set([1, 9]),
    );

    expect(plan.blocked).toBe(true);
    expect(plan.assignments).toEqual([]);
    expect(plan.preflight.existingIncompatibleUserLinks).toBe(1);
  });

  it('recognizes a correct existing link as idempotent', () => {
    const source = affiliate({ personId: 1 });
    const plan = buildIdentityLinkPlan(
      [source],
      [decision(source)],
      new Set([1]),
    );

    expect(plan).toMatchObject({
      blocked: false,
      assignments: [],
      preflight: { alreadyCorrectAffiliateLinks: 1 },
    });
  });

  it('blocks conflicting User ownership assignments', () => {
    const first = user();
    const second = user({ sourceId: 2, identification: '223456789' });
    const plan = buildIdentityLinkPlan(
      [first, second],
      [
        decision(first),
        decision(second, { identityClusterKey: 'NATIONAL:223456789' }),
      ],
      new Set([1]),
    );

    expect(plan.blocked).toBe(true);
    expect(plan.preflight.personToMultipleUserAssignmentConflicts).toBe(1);
  });

  it('blocks sources without one authoritative v1 manifest decision', () => {
    const source = user();
    const plan = buildIdentityLinkPlan([source], [], new Set([1]));

    expect(plan.blocked).toBe(true);
    expect(plan.preflight.unclassifiedLinkCases).toBe(1);
  });

  it('blocks multiple manifest decisions with conflicting Person selections', () => {
    const source = user();
    const plan = buildIdentityLinkPlan(
      [source],
      [decision(source), decision(source, { selectedPersonId: 2 })],
      new Set([1, 2]),
    );

    expect(plan.blocked).toBe(true);
    expect(plan.preflight.conflictingManifestSelections).toBe(1);
  });
});
