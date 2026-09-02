import {
  IDENTITY_NORMALIZATION_VERSION,
  RECONCILIATION_DECISION_VERSION,
  RECONCILIATION_MANIFEST_VERSION,
  sourceFingerprint,
  type IdentityClassification,
  type IdentitySource,
  type IdentitySourceModel,
} from './identity-reconciliation';

const SAFE_CLASSIFICATIONS = new Set<IdentityClassification>([
  'IDENTITY_MATCH',
  'IDENTITY_NOT_FOUND',
]);

export interface IdentityLinkSource extends IdentitySource {
  sourceModel: Extract<IdentitySourceModel, 'User' | 'Affiliate'>;
  personId: number | null;
}

export interface IdentityLinkManifestDecision {
  manifestVersion: string;
  sourceModel: IdentityLinkSource['sourceModel'];
  sourceId: number;
  sourceFingerprint: string;
  identityClusterKey: string | null;
  classification: string;
  selectedPersonId: number | null;
  personCreationAllowed: boolean;
  reviewRequired: boolean;
}

export interface IdentityLinkAssignment {
  sourceModel: IdentityLinkSource['sourceModel'];
  sourceId: number;
  personId: number;
}

export interface IdentityLinkPreflight {
  totalUsers: number;
  totalAffiliates: number;
  userManifestEntries: number;
  affiliateManifestEntries: number;
  safeUserLinkCandidates: number;
  safeAffiliateLinkCandidates: number;
  alreadyCorrectUserLinks: number;
  alreadyCorrectAffiliateLinks: number;
  manualReviewUserSources: number;
  manualReviewAffiliateSources: number;
  staleUserManifestEntries: number;
  staleAffiliateManifestEntries: number;
  missingSelectedPerson: number;
  conflictingManifestSelections: number;
  existingIncompatibleUserLinks: number;
  existingIncompatibleAffiliateLinks: number;
  personToMultipleUserAssignmentConflicts: number;
  personToMultipleAffiliateAssignmentConflicts: number;
  unclassifiedLinkCases: number;
}

export interface IdentityLinkPlan {
  preflight: IdentityLinkPreflight;
  assignments: IdentityLinkAssignment[];
  blocked: boolean;
}

export function buildIdentityLinkPlan(
  sources: readonly IdentityLinkSource[],
  manifestDecisions: readonly IdentityLinkManifestDecision[],
  existingPersonIds: ReadonlySet<number>,
): IdentityLinkPlan {
  const preflight = emptyPreflight(sources, manifestDecisions);
  const decisionsBySource = new Map<string, IdentityLinkManifestDecision[]>();
  const assignments: IdentityLinkAssignment[] = [];

  for (const decision of manifestDecisions) {
    const key = sourceKey(decision.sourceModel, decision.sourceId);
    const decisions = decisionsBySource.get(key) ?? [];
    decisions.push(decision);
    decisionsBySource.set(key, decisions);
  }

  for (const source of sources) {
    const decisions = decisionsBySource.get(
      sourceKey(source.sourceModel, source.sourceId),
    );
    if (!decisions || decisions.length !== 1) {
      preflight.unclassifiedLinkCases += 1;
      if (decisions && selectedPersonIds(decisions).size > 1) {
        preflight.conflictingManifestSelections += 1;
      }
      continue;
    }

    const decision = decisions[0];
    if (
      decision.selectedPersonId !== null &&
      !existingPersonIds.has(decision.selectedPersonId)
    ) {
      preflight.missingSelectedPerson += 1;
      continue;
    }
    if (!isSafeDecision(decision)) {
      if (decision.reviewRequired) incrementManualReview(preflight, source);
      else preflight.unclassifiedLinkCases += 1;
      continue;
    }
    if (sourceFingerprint(source) !== decision.sourceFingerprint) {
      incrementStaleManifest(preflight, source);
      continue;
    }

    const personId = decision.selectedPersonId;
    if (source.personId !== null) {
      if (source.personId === personId)
        incrementAlreadyCorrect(preflight, source);
      else incrementIncompatibleLink(preflight, source);
      continue;
    }
    incrementSafeCandidate(preflight, source);
    assignments.push({
      sourceModel: source.sourceModel,
      sourceId: source.sourceId,
      personId,
    });
  }

  countAssignmentConflicts(
    preflight,
    sources,
    manifestDecisions,
    existingPersonIds,
  );
  const blocked =
    preflight.missingSelectedPerson > 0 ||
    preflight.conflictingManifestSelections > 0 ||
    preflight.existingIncompatibleUserLinks > 0 ||
    preflight.existingIncompatibleAffiliateLinks > 0 ||
    preflight.personToMultipleUserAssignmentConflicts > 0 ||
    preflight.personToMultipleAffiliateAssignmentConflicts > 0 ||
    preflight.unclassifiedLinkCases > 0;

  return { preflight, assignments, blocked };
}

function emptyPreflight(
  sources: readonly IdentityLinkSource[],
  manifestDecisions: readonly IdentityLinkManifestDecision[],
): IdentityLinkPreflight {
  return {
    totalUsers: sources.filter((source) => source.sourceModel === 'User')
      .length,
    totalAffiliates: sources.filter(
      (source) => source.sourceModel === 'Affiliate',
    ).length,
    userManifestEntries: manifestDecisions.filter(
      (entry) => entry.sourceModel === 'User',
    ).length,
    affiliateManifestEntries: manifestDecisions.filter(
      (entry) => entry.sourceModel === 'Affiliate',
    ).length,
    safeUserLinkCandidates: 0,
    safeAffiliateLinkCandidates: 0,
    alreadyCorrectUserLinks: 0,
    alreadyCorrectAffiliateLinks: 0,
    manualReviewUserSources: 0,
    manualReviewAffiliateSources: 0,
    staleUserManifestEntries: 0,
    staleAffiliateManifestEntries: 0,
    missingSelectedPerson: 0,
    conflictingManifestSelections: 0,
    existingIncompatibleUserLinks: 0,
    existingIncompatibleAffiliateLinks: 0,
    personToMultipleUserAssignmentConflicts: 0,
    personToMultipleAffiliateAssignmentConflicts: 0,
    unclassifiedLinkCases: 0,
  };
}

function isSafeDecision(
  decision: IdentityLinkManifestDecision,
): decision is IdentityLinkManifestDecision & { selectedPersonId: number } {
  return (
    decision.selectedPersonId !== null &&
    !decision.reviewRequired &&
    decision.personCreationAllowed &&
    decision.identityClusterKey !== null &&
    SAFE_CLASSIFICATIONS.has(decision.classification as IdentityClassification)
  );
}

function countAssignmentConflicts(
  preflight: IdentityLinkPreflight,
  sources: readonly IdentityLinkSource[],
  decisions: readonly IdentityLinkManifestDecision[],
  existingPersonIds: ReadonlySet<number>,
): void {
  for (const sourceModel of ['User', 'Affiliate'] as const) {
    const desiredByPerson = new Map<number, number[]>();
    for (const source of sources.filter(
      (candidate) => candidate.sourceModel === sourceModel,
    )) {
      const decision = decisions.filter(
        (candidate) =>
          candidate.sourceModel === sourceModel &&
          candidate.sourceId === source.sourceId,
      );
      if (decision.length !== 1 || !isSafeDecision(decision[0])) continue;
      if (!existingPersonIds.has(decision[0].selectedPersonId)) continue;
      if (sourceFingerprint(source) !== decision[0].sourceFingerprint) continue;
      if (
        source.personId !== null &&
        source.personId !== decision[0].selectedPersonId
      )
        continue;
      const sourceIds = desiredByPerson.get(decision[0].selectedPersonId) ?? [];
      sourceIds.push(source.sourceId);
      desiredByPerson.set(decision[0].selectedPersonId, sourceIds);
    }
    const conflicts = [...desiredByPerson.values()].filter(
      (sourceIds) => sourceIds.length > 1,
    ).length;
    if (sourceModel === 'User') {
      preflight.personToMultipleUserAssignmentConflicts = conflicts;
    } else {
      preflight.personToMultipleAffiliateAssignmentConflicts = conflicts;
    }
  }
}

function selectedPersonIds(
  decisions: readonly IdentityLinkManifestDecision[],
): Set<number> {
  return new Set(
    decisions
      .map((decision) => decision.selectedPersonId)
      .filter((personId): personId is number => personId !== null),
  );
}

function sourceKey(sourceModel: string, sourceId: number): string {
  return `${sourceModel}:${sourceId}`;
}

function incrementSafeCandidate(
  preflight: IdentityLinkPreflight,
  source: IdentityLinkSource,
): void {
  if (source.sourceModel === 'User') preflight.safeUserLinkCandidates += 1;
  else preflight.safeAffiliateLinkCandidates += 1;
}

function incrementAlreadyCorrect(
  preflight: IdentityLinkPreflight,
  source: IdentityLinkSource,
): void {
  if (source.sourceModel === 'User') preflight.alreadyCorrectUserLinks += 1;
  else preflight.alreadyCorrectAffiliateLinks += 1;
}

function incrementManualReview(
  preflight: IdentityLinkPreflight,
  source: IdentityLinkSource,
): void {
  if (source.sourceModel === 'User') preflight.manualReviewUserSources += 1;
  else preflight.manualReviewAffiliateSources += 1;
}

function incrementStaleManifest(
  preflight: IdentityLinkPreflight,
  source: IdentityLinkSource,
): void {
  if (source.sourceModel === 'User') preflight.staleUserManifestEntries += 1;
  else preflight.staleAffiliateManifestEntries += 1;
}

function incrementIncompatibleLink(
  preflight: IdentityLinkPreflight,
  source: IdentityLinkSource,
): void {
  if (source.sourceModel === 'User') {
    preflight.existingIncompatibleUserLinks += 1;
  } else {
    preflight.existingIncompatibleAffiliateLinks += 1;
  }
}

export const identityLinkManifestVersions = {
  manifestVersion: RECONCILIATION_MANIFEST_VERSION,
  normalizationVersion: IDENTITY_NORMALIZATION_VERSION,
  decisionVersion: RECONCILIATION_DECISION_VERSION,
};
