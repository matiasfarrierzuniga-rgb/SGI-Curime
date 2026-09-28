import type {
  InstitutionalPreflightAbortDecision,
  InstitutionalPreflightBlocker,
} from './institutional-profile-abort-decision';

export type InstitutionalProfileCheckpointReadinessDecision =
  | 'ABORT'
  | 'CHECKPOINT_REQUIRED'
  | 'READY_FOR_MUTATION_GATE';

export type InstitutionalProfileCheckpointReadinessCode =
  | 'PREFLIGHT_ABORTED'
  | InstitutionalPreflightBlocker
  | 'CHECKPOINT_UNCONFIRMED'
  | 'RESTORE_READINESS_UNCONFIRMED'
  | 'CHECKPOINT_ENVIRONMENT_UNCONFIRMED'
  | 'CHECKPOINT_REFERENCE_MISSING';

export interface InstitutionalProfileCheckpointReadinessInput {
  preflight: InstitutionalPreflightAbortDecision;
  checkpointConfirmed: boolean;
  restoreReadinessConfirmed: boolean;
  checkpointEnvironmentConfirmed: boolean;
  checkpointReference: string | null;
}

export interface InstitutionalProfileCheckpointReadiness {
  decision: InstitutionalProfileCheckpointReadinessDecision;
  codes: InstitutionalProfileCheckpointReadinessCode[];
}

const PREFLIGHT_BLOCKER_ORDER: readonly InstitutionalPreflightBlocker[] = [
  'MIGRATION_HISTORY_MISMATCH',
  'INVALID_SINGLETON_ROOT',
  'BOTH_CONFLICTING',
  'UNSUPPORTED_BASELINE',
  'ENVIRONMENT_OWNERSHIP_UNCONFIRMED',
  'AUTHORITATIVE_CONFIGURATION_UNAVAILABLE',
];

const CHECKPOINT_CODE_ORDER: readonly InstitutionalProfileCheckpointReadinessCode[] = [
  'CHECKPOINT_UNCONFIRMED',
  'RESTORE_READINESS_UNCONFIRMED',
  'CHECKPOINT_ENVIRONMENT_UNCONFIRMED',
  'CHECKPOINT_REFERENCE_MISSING',
];

/**
 * Non-mutative DB-1C gate. Ready status authorizes only a future mutation gate.
 * It never creates, restores, or otherwise acts on a checkpoint.
 */
export function decideInstitutionalProfileCheckpointReadiness(
  input: InstitutionalProfileCheckpointReadinessInput,
): InstitutionalProfileCheckpointReadiness {
  if (input.preflight.decision === 'ABORT') {
    return {
      decision: 'ABORT',
      codes: [
        'PREFLIGHT_ABORTED',
        ...PREFLIGHT_BLOCKER_ORDER.filter((blocker) =>
          input.preflight.blockers.includes(blocker),
        ),
      ],
    };
  }

  const missing = new Set<InstitutionalProfileCheckpointReadinessCode>();

  if (!input.checkpointConfirmed) missing.add('CHECKPOINT_UNCONFIRMED');
  if (!input.restoreReadinessConfirmed) {
    missing.add('RESTORE_READINESS_UNCONFIRMED');
  }
  if (!input.checkpointEnvironmentConfirmed) {
    missing.add('CHECKPOINT_ENVIRONMENT_UNCONFIRMED');
  }
  if (!hasOpaqueCheckpointReference(input.checkpointReference)) {
    missing.add('CHECKPOINT_REFERENCE_MISSING');
  }

  const codes = CHECKPOINT_CODE_ORDER.filter((code) => missing.has(code));
  return {
    decision: codes.length === 0 ? 'READY_FOR_MUTATION_GATE' : 'CHECKPOINT_REQUIRED',
    codes,
  };
}

function hasOpaqueCheckpointReference(reference: string | null): boolean {
  return typeof reference === 'string' && reference.trim().length > 0;
}
