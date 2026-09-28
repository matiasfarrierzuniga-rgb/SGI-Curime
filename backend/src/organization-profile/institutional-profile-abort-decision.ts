import type { InstitutionalPreflightReport } from './institutional-profile-preflight';

export type InstitutionalPreflightDecision =
  | 'ABORT'
  | 'PROCEED_TO_CHECKPOINT';

export type InstitutionalPreflightBlocker =
  | 'MIGRATION_HISTORY_MISMATCH'
  | 'INVALID_SINGLETON_ROOT'
  | 'BOTH_CONFLICTING'
  | 'UNSUPPORTED_BASELINE'
  | 'ENVIRONMENT_OWNERSHIP_UNCONFIRMED'
  | 'AUTHORITATIVE_CONFIGURATION_UNAVAILABLE';

export interface InstitutionalPreflightOperatorReadiness {
  environmentOwnershipConfirmed: boolean;
  authoritativeConfigurationRequired: boolean;
  authoritativeConfigurationReady: boolean;
}

export interface InstitutionalPreflightAbortDecision {
  decision: InstitutionalPreflightDecision;
  blockers: InstitutionalPreflightBlocker[];
}

const BLOCKER_ORDER: readonly InstitutionalPreflightBlocker[] = [
  'MIGRATION_HISTORY_MISMATCH',
  'INVALID_SINGLETON_ROOT',
  'BOTH_CONFLICTING',
  'UNSUPPORTED_BASELINE',
  'ENVIRONMENT_OWNERSHIP_UNCONFIRMED',
  'AUTHORITATIVE_CONFIGURATION_UNAVAILABLE',
];

/**
 * Non-mutative DB-1B gate. A proceed decision authorizes only DB-1C
 * checkpoint/restore readiness; it never authorizes migration or reconciliation.
 */
export function decideInstitutionalPreflightAbort(
  report: InstitutionalPreflightReport,
  readiness: InstitutionalPreflightOperatorReadiness,
): InstitutionalPreflightAbortDecision {
  const blockers = new Set<InstitutionalPreflightBlocker>();

  if (
    report.classification === 'HISTORY_MISMATCH' ||
    hasReportedHistoryProblems(report)
  ) {
    blockers.add('MIGRATION_HISTORY_MISMATCH');
  }
  if (hasInvalidSingletonRoot(report)) blockers.add('INVALID_SINGLETON_ROOT');
  if (report.classification === 'BOTH_CONFLICTING') {
    blockers.add('BOTH_CONFLICTING');
  }
  if (
    report.classification !== 'MAIN_LEGACY_ONLY' &&
    report.classification !== 'HISTORY_MISMATCH'
  ) {
    blockers.add('UNSUPPORTED_BASELINE');
  }
  if (!readiness.environmentOwnershipConfirmed) {
    blockers.add('ENVIRONMENT_OWNERSHIP_UNCONFIRMED');
  }
  if (
    readiness.authoritativeConfigurationRequired &&
    !readiness.authoritativeConfigurationReady
  ) {
    blockers.add('AUTHORITATIVE_CONFIGURATION_UNAVAILABLE');
  }

  const orderedBlockers = BLOCKER_ORDER.filter((blocker) => blockers.has(blocker));
  return {
    decision: orderedBlockers.length === 0 ? 'PROCEED_TO_CHECKPOINT' : 'ABORT',
    blockers: orderedBlockers,
  };
}

function hasReportedHistoryProblems(report: InstitutionalPreflightReport): boolean {
  return Array.isArray(report.historyProblems) && report.historyProblems.length > 0;
}

function hasInvalidSingletonRoot(report: InstitutionalPreflightReport): boolean {
  return (
    (report.legacyTablePresent &&
      (report.legacyRowCount !== 1 || report.legacySingletonPresent !== true)) ||
    (report.canonicalTablePresent &&
      (report.canonicalRowCount !== 1 || report.canonicalSingletonPresent !== true))
  );
}
