import type { D1RegionAttestation } from './d1-region-attestation.config';
import type { D1RegionValidationResult } from './d1-region-validation';
import type { D2PhysicalAddressAttestation } from './d2-physical-address-attestation.config';
import type { D2PhysicalAddressValidationResult } from './d2-physical-address-validation';
import type { D3OrganizationTypeAttestation } from './d3-organization-type-attestation.config';
import type { D3OrganizationTypeValidationResult } from './d3-organization-type-validation';
import type { D4LocalityTransitionEvidence } from './d4-locality-transition-evidence';
import type { D5ContactValidationResult } from './d5-contact-validation';
import type {
  InstitutionalPreflightReport,
  InstitutionalRootRow,
} from './institutional-profile-preflight';
import type { CanonicalOrganizationProfileInput } from './organization-profile-input.config';

export const D6_EQUIVALENT_ROOT_SELECTION_ENV = {
  approved: 'DB1_D6_EQUIVALENT_ROOT_SELECTION_APPROVED',
  selection: 'DB1_D6_EQUIVALENT_ROOT_SELECTION',
} as const;

/** Root tokens intentionally match preflight's legacy/canonical terminology. */
export type EquivalentRootSelection = 'LEGACY' | 'CANONICAL';

export interface D6EquivalentRootSelectionConfiguration {
  approved: string | null | undefined;
  selection: string | null | undefined;
}

export interface D4CurrentTransitionEvidence {
  /** True only after current D4 extraction has been performed. */
  current: boolean;
  /** Null is valid when D4 found no meaningful legacy locality. */
  evidence: D4LocalityTransitionEvidence | null;
}

export interface OrganizationProfileReconciliationAttestations {
  d1: D1RegionAttestation;
  d2: D2PhysicalAddressAttestation;
  d3: D3OrganizationTypeAttestation;
}

export interface OrganizationProfileReconciliationValidations {
  d1: D1RegionValidationResult;
  d2: D2PhysicalAddressValidationResult;
  d3: D3OrganizationTypeValidationResult;
  d5: D5ContactValidationResult;
}

export interface OrganizationProfileObservedState {
  preflight: InstitutionalPreflightReport;
  /** Internal values only; never expose through diagnostics. */
  legacyRoot: InstitutionalRootRow | null;
  /** Internal values only; canonical-only state is re-attested against input. */
  canonicalRoot: InstitutionalRootRow | null;
}

export interface OrganizationProfileReconciliationPlanningInput {
  observedState: OrganizationProfileObservedState;
  canonicalInput: CanonicalOrganizationProfileInput;
  attestations: OrganizationProfileReconciliationAttestations;
  validations: OrganizationProfileReconciliationValidations;
  d4Transition: D4CurrentTransitionEvidence;
  d6EquivalentRootSelection?: D6EquivalentRootSelectionConfiguration;
}

export type ReconciliationDiagnosticCode =
  | 'D1_VALIDATION_BLOCKED'
  | 'D2_VALIDATION_BLOCKED'
  | 'D3_VALIDATION_BLOCKED'
  | 'D5_VALIDATION_BLOCKED'
  | 'D4_TRANSITION_EVIDENCE_NOT_CURRENT'
  | 'CANONICAL_INPUT_MISMATCH'
  | 'D6_EQUIVALENT_ROOT_SELECTION_NOT_APPROVED'
  | 'D6_EQUIVALENT_ROOT_SELECTION_INVALID'
  | 'BOTH_CONFLICTING'
  | 'HISTORY_MISMATCH'
  | 'UNSUPPORTED_PREFLIGHT_STATE';

export interface ReconciliationPlanDiagnostics {
  codes: ReconciliationDiagnosticCode[];
}

export type OrganizationProfileReconciliationPlan =
  | {
      outcome: 'PLAN';
      action: 'RECONCILE_CANONICAL_SHADOW_FROM_MAIN_LEGACY';
      canonicalInput: CanonicalOrganizationProfileInput;
      transitionEvidence: D4LocalityTransitionEvidence | null;
      diagnostics: ReconciliationPlanDiagnostics;
    }
  | {
      outcome: 'PLAN';
      action: 'PRESERVE_CANONICAL_ROOT';
      diagnostics: ReconciliationPlanDiagnostics;
    }
  | {
      outcome: 'PLAN';
      action: 'PRESERVE_REVIEWED_EQUIVALENT_ROOT';
      selectedRoot: EquivalentRootSelection;
      diagnostics: ReconciliationPlanDiagnostics;
    }
  | {
      outcome: 'BLOCK_CUTOVER';
      diagnostics: ReconciliationPlanDiagnostics;
    };

const DIAGNOSTIC_ORDER: readonly ReconciliationDiagnosticCode[] = [
  'D1_VALIDATION_BLOCKED',
  'D2_VALIDATION_BLOCKED',
  'D3_VALIDATION_BLOCKED',
  'D5_VALIDATION_BLOCKED',
  'D4_TRANSITION_EVIDENCE_NOT_CURRENT',
  'CANONICAL_INPUT_MISMATCH',
  'D6_EQUIVALENT_ROOT_SELECTION_NOT_APPROVED',
  'D6_EQUIVALENT_ROOT_SELECTION_INVALID',
  'BOTH_CONFLICTING',
  'HISTORY_MISMATCH',
  'UNSUPPORTED_PREFLIGHT_STATE',
];

/**
 * Pure D6/D10 decision layer. Callers supply already-run D1-D5 validators
 * and attestations; this layer never loads environment state or persists data.
 * Diagnostics expose only stable gate codes, never institutional values,
 * authority references, or locality.
 */
export function planOrganizationProfileReconciliation(
  input: OrganizationProfileReconciliationPlanningInput,
): OrganizationProfileReconciliationPlan {
  const blockers = gateBlockers(input.validations);
  const state = input.observedState.preflight.classification;
  const requiresD4CurrentEvidence =
    state === 'MAIN_LEGACY_ONLY' || state === 'BOTH_EQUIVALENT';

  if (requiresD4CurrentEvidence && !input.d4Transition.current) {
    blockers.add('D4_TRANSITION_EVIDENCE_NOT_CURRENT');
  }

  if (state === 'CANONICAL_ONLY' && !matchesCanonicalInput(
    input.observedState.canonicalRoot,
    input.canonicalInput,
  )) {
    blockers.add('CANONICAL_INPUT_MISMATCH');
  }

  if (state === 'BOTH_CONFLICTING') blockers.add('BOTH_CONFLICTING');
  if (state === 'HISTORY_MISMATCH') blockers.add('HISTORY_MISMATCH');
  if (
    state === 'NEITHER' ||
    (state !== 'MAIN_LEGACY_ONLY' &&
      state !== 'CANONICAL_ONLY' &&
      state !== 'BOTH_EQUIVALENT' &&
      state !== 'BOTH_CONFLICTING' &&
      state !== 'HISTORY_MISMATCH')
  ) {
    blockers.add('UNSUPPORTED_PREFLIGHT_STATE');
  }

  let selectedRoot: EquivalentRootSelection | null = null;
  if (state === 'BOTH_EQUIVALENT') {
    const selection = parseApprovedEquivalentRootSelection(
      input.d6EquivalentRootSelection,
    );
    if (selection === null) {
      if (isApproved(input.d6EquivalentRootSelection?.approved)) {
        blockers.add('D6_EQUIVALENT_ROOT_SELECTION_INVALID');
      } else {
        blockers.add('D6_EQUIVALENT_ROOT_SELECTION_NOT_APPROVED');
      }
    } else {
      selectedRoot = selection;
    }
  }

  const diagnostics = { codes: ordered(blockers) };
  if (diagnostics.codes.length > 0) {
    return { outcome: 'BLOCK_CUTOVER', diagnostics };
  }

  if (state === 'MAIN_LEGACY_ONLY') {
    return {
      outcome: 'PLAN',
      action: 'RECONCILE_CANONICAL_SHADOW_FROM_MAIN_LEGACY',
      canonicalInput: input.canonicalInput,
      transitionEvidence: input.d4Transition.evidence,
      diagnostics,
    };
  }
  if (state === 'CANONICAL_ONLY') {
    return { outcome: 'PLAN', action: 'PRESERVE_CANONICAL_ROOT', diagnostics };
  }
  if (state === 'BOTH_EQUIVALENT' && selectedRoot !== null) {
    return {
      outcome: 'PLAN',
      action: 'PRESERVE_REVIEWED_EQUIVALENT_ROOT',
      selectedRoot,
      diagnostics,
    };
  }

  return {
    outcome: 'BLOCK_CUTOVER',
    diagnostics: { codes: ['UNSUPPORTED_PREFLIGHT_STATE'] },
  };
}

function gateBlockers(
  validations: OrganizationProfileReconciliationValidations,
): Set<ReconciliationDiagnosticCode> {
  const blockers = new Set<ReconciliationDiagnosticCode>();
  if (validations.d1.decision === 'BLOCK_CUTOVER') blockers.add('D1_VALIDATION_BLOCKED');
  if (validations.d2.decision === 'BLOCK_CUTOVER') blockers.add('D2_VALIDATION_BLOCKED');
  if (validations.d3.decision === 'BLOCK_CUTOVER') blockers.add('D3_VALIDATION_BLOCKED');
  if (validations.d5.decision === 'BLOCK_CUTOVER') blockers.add('D5_VALIDATION_BLOCKED');
  return blockers;
}

function matchesCanonicalInput(
  row: InstitutionalRootRow | null,
  canonicalInput: CanonicalOrganizationProfileInput,
): boolean {
  if (!row) return false;

  return (
    row.legalName === canonicalInput.legalName &&
    row.legalIdentification === canonicalInput.legalIdentification &&
    row.dinadecoRegistrationCode === canonicalInput.dinadecoRegistrationCode &&
    row.organizationType === canonicalInput.organizationType &&
    row.region === canonicalInput.region &&
    row.province === canonicalInput.province &&
    row.canton === canonicalInput.canton &&
    row.district === canonicalInput.district &&
    row.physicalAddress === canonicalInput.physicalAddress &&
    row.notificationPhone === canonicalInput.notificationPhone &&
    row.notificationFax === canonicalInput.notificationFax &&
    row.notificationEmail === canonicalInput.notificationEmail
  );
}

function isApproved(value: string | null | undefined): boolean {
  return value?.trim() === 'true';
}

function parseApprovedEquivalentRootSelection(
  configuration: D6EquivalentRootSelectionConfiguration | undefined,
): EquivalentRootSelection | null {
  if (!isApproved(configuration?.approved)) return null;
  const selection = configuration?.selection?.trim();
  return selection === 'LEGACY' || selection === 'CANONICAL' ? selection : null;
}

function ordered(
  codes: ReadonlySet<ReconciliationDiagnosticCode>,
): ReconciliationDiagnosticCode[] {
  return DIAGNOSTIC_ORDER.filter((code) => codes.has(code));
}
