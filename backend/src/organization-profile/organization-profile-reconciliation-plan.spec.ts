import {
  planOrganizationProfileReconciliation,
  type OrganizationProfileReconciliationPlanningInput,
} from './organization-profile-reconciliation-plan';

const canonicalInput = {
  legalName: 'synthetic legal name',
  legalIdentification: 'synthetic identification',
  dinadecoRegistrationCode: 'synthetic registration',
  organizationType: 'Asociación de Desarrollo Integral',
  region: 'synthetic region',
  province: 'synthetic province',
  canton: 'synthetic canton',
  district: 'synthetic district',
  physicalAddress: 'synthetic address',
  notificationPhone: '2222',
  notificationFax: null,
  notificationEmail: 'synthetic@example.test',
};

const rootRow = { id: 1, ...canonicalInput };

function input(
  classification: OrganizationProfileReconciliationPlanningInput['observedState']['preflight']['classification'],
): OrganizationProfileReconciliationPlanningInput {
  return {
    observedState: {
      preflight: {
        classification,
        migrationMetadataPresent: true,
        legacyTablePresent: classification !== 'CANONICAL_ONLY' && classification !== 'NEITHER',
        canonicalTablePresent: classification !== 'MAIN_LEGACY_ONLY' && classification !== 'NEITHER',
        legacyRowCount: 1,
        legacySingletonPresent: true,
        canonicalRowCount: 1,
        canonicalSingletonPresent: true,
        boardTermCount: 0,
        boardAppointmentCount: 0,
        boardTermForeignKeyTarget: null,
        boardTermForeignKeyTargetColumn: null,
        legacySingletonConstraint: 'VALID',
        legacyFieldDefinitions: 'VALID',
        canonicalShadowDefinitions: 'VALID',
        institutionalOrganizationTypeEnum: 'VALID',
        conflictingFields: [],
        historyProblems: [],
      },
      legacyRoot: rootRow,
      canonicalRoot: rootRow,
    },
    canonicalInput,
    attestations: {
      d1: { attested: true, authorityReference: 'synthetic-d1' },
      d2: { attested: true, authorityReference: 'synthetic-d2', correspondenceAddressEquivalent: false },
      d3: { attested: true, authorityReference: 'synthetic-d3' },
    },
    validations: {
      d1: { decision: 'ACCEPT', codes: [] },
      d2: { decision: 'ACCEPT', codes: [] },
      d3: { decision: 'ACCEPT', codes: [] },
      d5: { decision: 'ACCEPT', codes: [] },
    },
    d4Transition: { current: true, evidence: { locality: 'synthetic locality' } },
  };
}

describe('organization profile reconciliation plan', () => {
  it('creates executable canonical-shadow plan from MAIN_LEGACY_ONLY', () => {
    expect(planOrganizationProfileReconciliation(input('MAIN_LEGACY_ONLY'))).toMatchObject({
      outcome: 'PLAN',
      action: 'RECONCILE_CANONICAL_SHADOW_FROM_MAIN_LEGACY',
    });
  });

  it.each(['d1', 'd2', 'd3', 'd5'] as const)('blocks each %s validation gate', (gate) => {
    const planningInput = input('MAIN_LEGACY_ONLY');
    planningInput.validations[gate] = { decision: 'BLOCK_CUTOVER', codes: [] } as never;

    expect(planOrganizationProfileReconciliation(planningInput)).toMatchObject({
      outcome: 'BLOCK_CUTOVER',
      diagnostics: { codes: [`${gate.toUpperCase()}_VALIDATION_BLOCKED`] },
    });
  });

  it('preserves re-attested canonical-only root', () => {
    expect(planOrganizationProfileReconciliation(input('CANONICAL_ONLY'))).toMatchObject({
      outcome: 'PLAN', action: 'PRESERVE_CANONICAL_ROOT',
    });
  });

  it('blocks canonical-only root when controlled input differs', () => {
    const planningInput = input('CANONICAL_ONLY');
    planningInput.observedState.canonicalRoot = { ...rootRow, legalName: 'different synthetic value' };

    expect(planOrganizationProfileReconciliation(planningInput)).toMatchObject({
      outcome: 'BLOCK_CUTOVER', diagnostics: { codes: ['CANONICAL_INPUT_MISMATCH'] },
    });
  });

  it.each(['BOTH_CONFLICTING', 'NEITHER', 'HISTORY_MISMATCH'] as const)(
    'blocks unsupported %s state',
    (state) => expect(planOrganizationProfileReconciliation(input(state))).toMatchObject({ outcome: 'BLOCK_CUTOVER' }),
  );

  it('requires exact approved reviewed root selection for BOTH_EQUIVALENT', () => {
    const planningInput = input('BOTH_EQUIVALENT');
    planningInput.d6EquivalentRootSelection = { approved: ' true ', selection: ' CANONICAL ' };

    expect(planOrganizationProfileReconciliation(planningInput)).toMatchObject({
      outcome: 'PLAN', action: 'PRESERVE_REVIEWED_EQUIVALENT_ROOT', selectedRoot: 'CANONICAL',
    });
  });

  it.each([
    { approved: undefined, selection: 'LEGACY' },
    { approved: 'false', selection: 'LEGACY' },
    { approved: 'true', selection: 'DEFAULT' },
  ])('blocks unapproved or invalid equivalent selection', (d6EquivalentRootSelection) => {
    const planningInput = input('BOTH_EQUIVALENT');
    planningInput.d6EquivalentRootSelection = d6EquivalentRootSelection;

    expect(planOrganizationProfileReconciliation(planningInput).outcome).toBe('BLOCK_CUTOVER');
  });

  it('requires current D4 evidence, keeps it transition-only, and emits no locality', () => {
    const planningInput = input('MAIN_LEGACY_ONLY');
    planningInput.d4Transition = { current: false, evidence: null };
    const plan = planOrganizationProfileReconciliation(planningInput);

    expect(plan).toEqual({
      outcome: 'BLOCK_CUTOVER',
      diagnostics: { codes: ['D4_TRANSITION_EVIDENCE_NOT_CURRENT'] },
    });
    expect(JSON.stringify(plan)).not.toContain('synthetic locality');
  });
});
