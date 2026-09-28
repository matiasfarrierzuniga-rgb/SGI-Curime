import {
  decideInstitutionalPreflightAbort,
  type InstitutionalPreflightOperatorReadiness,
} from './institutional-profile-abort-decision';
import type { InstitutionalPreflightReport } from './institutional-profile-preflight';

describe('institutional profile abort decision', () => {
  it('aborts migration history mismatches', () => {
    expect(decideInstitutionalPreflightAbort(report({
      classification: 'HISTORY_MISMATCH',
      historyProblems: ['PROTECTED_MIGRATION_INVALID'],
    }), ready())).toEqual({
      decision: 'ABORT',
      blockers: ['MIGRATION_HISTORY_MISMATCH'],
    });
  });

  it('aborts conflicting dual roots', () => {
    expect(decideInstitutionalPreflightAbort(report({
      classification: 'BOTH_CONFLICTING',
      legacyTablePresent: true,
      canonicalTablePresent: true,
      canonicalRowCount: 1,
      canonicalSingletonPresent: true,
      conflictingFields: ['legalName'],
    }), ready())).toEqual({
      decision: 'ABORT',
      blockers: ['BOTH_CONFLICTING', 'UNSUPPORTED_BASELINE'],
    });
  });

  it('aborts NEITHER as unsupported baseline', () => {
    expect(decideInstitutionalPreflightAbort(report({
      classification: 'NEITHER',
    }), ready())).toEqual({
      decision: 'ABORT',
      blockers: ['UNSUPPORTED_BASELINE'],
    });
  });

  it('aborts invalid singleton evidence despite a fabricated supported classification', () => {
    expect(decideInstitutionalPreflightAbort(report({
      legacyRowCount: 2,
      legacySingletonPresent: false,
    }), ready())).toEqual({
      decision: 'ABORT',
      blockers: ['INVALID_SINGLETON_ROOT'],
    });
  });

  it('aborts without explicit environment ownership confirmation', () => {
    expect(decideInstitutionalPreflightAbort(report(), ready({
      environmentOwnershipConfirmed: false,
    }))).toEqual({
      decision: 'ABORT',
      blockers: ['ENVIRONMENT_OWNERSHIP_UNCONFIRMED'],
    });
  });

  it('aborts when required authoritative configuration is unavailable', () => {
    expect(decideInstitutionalPreflightAbort(report(), ready({
      authoritativeConfigurationRequired: true,
      authoritativeConfigurationReady: false,
    }))).toEqual({
      decision: 'ABORT',
      blockers: ['AUTHORITATIVE_CONFIGURATION_UNAVAILABLE'],
    });
  });

  it('proceeds only to checkpoint readiness for supported legacy baseline', () => {
    expect(decideInstitutionalPreflightAbort(report(), ready({
      authoritativeConfigurationRequired: true,
      authoritativeConfigurationReady: true,
    }))).toEqual({
      decision: 'PROCEED_TO_CHECKPOINT',
      blockers: [],
    });
  });

  it.each(['CANONICAL_ONLY', 'BOTH_EQUIVALENT'] as const)(
    'aborts %s as non-authorizing baseline',
    (classification) => {
      expect(decideInstitutionalPreflightAbort(report({ classification }), ready())).toEqual({
        decision: 'ABORT',
        blockers: ['UNSUPPORTED_BASELINE'],
      });
    },
  );

  it('returns only fixed blocker codes, never report payload values', () => {
    const decision = decideInstitutionalPreflightAbort(report({
      classification: 'BOTH_CONFLICTING',
      conflictingFields: ['privateFieldValue'],
      historyProblems: ['private-history-value'],
    }), ready());

    expect(JSON.stringify(decision)).not.toContain('privateFieldValue');
    expect(JSON.stringify(decision)).not.toContain('private-history-value');
  });

  it('dedupes multiple blockers in deterministic order', () => {
    expect(decideInstitutionalPreflightAbort(report({
      classification: 'BOTH_CONFLICTING',
      legacyRowCount: 3,
      legacySingletonPresent: false,
      historyProblems: ['ONE', 'ONE'],
    }), ready({
      environmentOwnershipConfirmed: false,
      authoritativeConfigurationRequired: true,
      authoritativeConfigurationReady: false,
    }))).toEqual({
      decision: 'ABORT',
      blockers: [
        'MIGRATION_HISTORY_MISMATCH',
        'INVALID_SINGLETON_ROOT',
        'BOTH_CONFLICTING',
        'UNSUPPORTED_BASELINE',
        'ENVIRONMENT_OWNERSHIP_UNCONFIRMED',
        'AUTHORITATIVE_CONFIGURATION_UNAVAILABLE',
      ],
    });
  });
});

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

function ready(
  overrides: Partial<InstitutionalPreflightOperatorReadiness> = {},
): InstitutionalPreflightOperatorReadiness {
  return {
    environmentOwnershipConfirmed: true,
    authoritativeConfigurationRequired: false,
    authoritativeConfigurationReady: false,
    ...overrides,
  };
}
