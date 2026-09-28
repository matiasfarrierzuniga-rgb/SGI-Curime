import {
  decideInstitutionalProfileCheckpointReadiness,
  type InstitutionalProfileCheckpointReadinessInput,
} from './institutional-profile-checkpoint-readiness';
import { decideInstitutionalPreflightAbort } from './institutional-profile-abort-decision';
import type { InstitutionalPreflightReport } from './institutional-profile-preflight';

describe('institutional profile checkpoint readiness', () => {
  it('aborts when DB-1B aborts, regardless of complete checkpoint evidence', () => {
    expect(decideInstitutionalProfileCheckpointReadiness(evidence({
      preflight: {
        decision: 'ABORT',
        blockers: ['MIGRATION_HISTORY_MISMATCH'],
      },
    }))).toEqual({
      decision: 'ABORT',
      codes: ['PREFLIGHT_ABORTED', 'MIGRATION_HISTORY_MISMATCH'],
    });
  });

  it.each([
    ['checkpoint confirmation', { checkpointConfirmed: false }, 'CHECKPOINT_UNCONFIRMED'],
    ['restore readiness', { restoreReadinessConfirmed: false }, 'RESTORE_READINESS_UNCONFIRMED'],
    ['checkpoint environment association', { checkpointEnvironmentConfirmed: false }, 'CHECKPOINT_ENVIRONMENT_UNCONFIRMED'],
    ['checkpoint reference', { checkpointReference: '   ' }, 'CHECKPOINT_REFERENCE_MISSING'],
  ] as const)('requires %s when evidence is missing', (_, overrides, code) => {
    expect(decideInstitutionalProfileCheckpointReadiness(evidence(overrides))).toEqual({
      decision: 'CHECKPOINT_REQUIRED',
      codes: [code],
    });
  });

  it('reaches only the future mutation gate with complete explicit evidence', () => {
    expect(decideInstitutionalProfileCheckpointReadiness(evidence())).toEqual({
      decision: 'READY_FOR_MUTATION_GATE',
      codes: [],
    });
  });

  it('never serializes opaque checkpoint, credential, or institutional payload tokens', () => {
    const checkpointReferenceToken = 'sentinel-checkpoint-reference';
    const databaseUrlFragmentToken = 'sentinel-db-url-fragment';
    const credentialFragmentToken = 'sentinel-credential-fragment';
    const institutionalPayloadToken = 'sentinel-institutional-payload';
    const result = decideInstitutionalProfileCheckpointReadiness(evidence({
      checkpointReference: [
        checkpointReferenceToken,
        databaseUrlFragmentToken,
        credentialFragmentToken,
        institutionalPayloadToken,
      ].join(':'),
    }));

    const serializedResult = JSON.stringify(result);
    expect(serializedResult).not.toContain(checkpointReferenceToken);
    expect(serializedResult).not.toContain(databaseUrlFragmentToken);
    expect(serializedResult).not.toContain(credentialFragmentToken);
    expect(serializedResult).not.toContain(institutionalPayloadToken);
  });

  it('returns deduped codes in deterministic order', () => {
    expect(decideInstitutionalProfileCheckpointReadiness(evidence({
      checkpointConfirmed: false,
      restoreReadinessConfirmed: false,
      checkpointEnvironmentConfirmed: false,
      checkpointReference: null,
    }))).toEqual({
      decision: 'CHECKPOINT_REQUIRED',
      codes: [
        'CHECKPOINT_UNCONFIRMED',
        'RESTORE_READINESS_UNCONFIRMED',
        'CHECKPOINT_ENVIRONMENT_UNCONFIRMED',
        'CHECKPOINT_REFERENCE_MISSING',
      ],
    });
  });

  it('aborts current NEITHER baseline through the DB-1B unsupported path', () => {
    const preflight = decideInstitutionalPreflightAbort(report({
      classification: 'NEITHER',
      legacyTablePresent: false,
      canonicalTablePresent: false,
      legacyRowCount: null,
      legacySingletonPresent: null,
    }), {
      environmentOwnershipConfirmed: true,
      authoritativeConfigurationRequired: false,
      authoritativeConfigurationReady: false,
    });

    expect(decideInstitutionalProfileCheckpointReadiness(evidence({ preflight }))).toEqual({
      decision: 'ABORT',
      codes: ['PREFLIGHT_ABORTED', 'UNSUPPORTED_BASELINE'],
    });
  });
});

function evidence(
  overrides: Partial<InstitutionalProfileCheckpointReadinessInput> = {},
): InstitutionalProfileCheckpointReadinessInput {
  return {
    preflight: { decision: 'PROCEED_TO_CHECKPOINT', blockers: [] },
    checkpointConfirmed: true,
    restoreReadinessConfirmed: true,
    checkpointEnvironmentConfirmed: true,
    checkpointReference: 'checkpoint-ref',
    ...overrides,
  };
}

function report(
  overrides: Partial<InstitutionalPreflightReport> = {},
): InstitutionalPreflightReport {
  return {
    classification: 'MAIN_LEGACY_ONLY',
    migrationMetadataPresent: true,
    legacyTablePresent: true,
    canonicalTablePresent: false,
    legacyRowCount: 1,
    legacySingletonPresent: true,
    canonicalRowCount: null,
    canonicalSingletonPresent: null,
    boardTermCount: 0,
    boardAppointmentCount: 0,
    boardTermForeignKeyTarget: 'public.InstitutionalProfile',
    boardTermForeignKeyTargetColumn: 'id',
    legacySingletonConstraint: 'VALID',
    legacyFieldDefinitions: 'VALID',
    canonicalShadowDefinitions: 'VALID',
    institutionalOrganizationTypeEnum: 'VALID',
    conflictingFields: [],
    historyProblems: [],
    ...overrides,
  };
}
