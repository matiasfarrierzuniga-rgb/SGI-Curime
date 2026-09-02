import { createHash } from 'node:crypto';
import {
  isValidIdentification,
  type SupportedIdentificationType,
} from '../common/validation/identity-contact.validation';

export const IDENTITY_NORMALIZATION_VERSION = 'v1';
export const RECONCILIATION_MANIFEST_VERSION = 'v1';
export const RECONCILIATION_DECISION_VERSION = 'v1';

export type IdentitySourceModel =
  'User' | 'Affiliate' | 'UserRequest' | 'AffiliateRequest';

export type IdentityClassification =
  | 'IDENTITY_MATCH'
  | 'IDENTITY_NOT_FOUND'
  | 'IDENTITY_CONFLICT'
  | 'IDENTITY_INCOMPLETE'
  | 'IDENTITY_DUPLICATE'
  | 'MANUAL_REVIEW_REQUIRED';

export interface IdentitySource {
  sourceModel: IdentitySourceModel;
  sourceId: number;
  identification: string | null;
  identificationType: string | null;
  fullName: string | null;
  birthDate: Date | null;
  email: string | null;
  phoneCountryCode: string | null;
  phoneNationalNumber: string | null;
  address: string | null;
}

export interface ReconciliationEntry {
  source: IdentitySource;
  rawIdentification: string | null;
  identificationType: SupportedIdentificationType | null;
  normalizedIdentification: string | null;
  identityClusterKey: string | null;
  classification: IdentityClassification;
  personCreationAllowed: boolean;
  conflictCodes: string[];
  nameReconciliationRequired: boolean;
  reviewRequired: boolean;
}

export interface ReconciliationCluster {
  identityClusterKey: string | null;
  classification: IdentityClassification;
  personCreationAllowed: boolean;
  conflictCodes: string[];
  nameReconciliationRequired: boolean;
  reviewRequired: boolean;
  entries: ReconciliationEntry[];
}

export interface PersonBackfillData {
  identification: string;
  identificationType: SupportedIdentificationType;
  normalizedIdentification: string;
  legacyFullName: string | null;
  birthDate: Date | null;
  email: string | null;
  phoneCountryCode: string | null;
  phoneNationalNumber: string | null;
  address: string | null;
}

interface NormalizedIdentity {
  rawIdentification: string;
  identificationType: SupportedIdentificationType;
  normalizedIdentification: string;
}

export function normalizeIdentification(
  identificationType: string | null,
  identification: string | null,
): NormalizedIdentity | null {
  const rawIdentification = identification?.trim();
  if (
    !rawIdentification ||
    !isSupportedIdentificationType(identificationType)
  ) {
    return null;
  }
  if (!isValidIdentification(identificationType, rawIdentification))
    return null;

  return {
    rawIdentification,
    identificationType,
    normalizedIdentification: rawIdentification,
  };
}

export function reconcileIdentitySources(
  sources: readonly IdentitySource[],
): ReconciliationCluster[] {
  const entries = sources.map(toEntry);
  const byKey = new Map<string, ReconciliationEntry[]>();
  const incomplete: ReconciliationCluster[] = [];

  for (const entry of entries) {
    if (!entry.identityClusterKey) {
      incomplete.push({
        identityClusterKey: null,
        classification: 'IDENTITY_INCOMPLETE',
        personCreationAllowed: false,
        conflictCodes: ['IDENTITY_KEY_INCOMPLETE'],
        nameReconciliationRequired: false,
        reviewRequired: true,
        entries: [
          {
            ...entry,
            classification: 'IDENTITY_INCOMPLETE',
            personCreationAllowed: false,
            conflictCodes: ['IDENTITY_KEY_INCOMPLETE'],
            reviewRequired: true,
          },
        ],
      });
      continue;
    }
    const clusterEntries = byKey.get(entry.identityClusterKey) ?? [];
    clusterEntries.push(entry);
    byKey.set(entry.identityClusterKey, clusterEntries);
  }

  const clusters = [...byKey.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([identityClusterKey, clusterEntries]) =>
      classifyCluster(identityClusterKey, clusterEntries),
    );

  const allClusters = [...clusters, ...incomplete];
  applyCrossIdentityManualReview(allClusters);
  return allClusters.sort(compareClusters);
}

export function createPersonBackfillData(
  cluster: ReconciliationCluster,
): PersonBackfillData | null {
  if (!cluster.personCreationAllowed || !cluster.identityClusterKey)
    return null;
  const operationalEntries = cluster.entries.filter(isOperationalEntry);
  const identity = normalizeIdentification(
    operationalEntries[0]?.identificationType ?? null,
    operationalEntries[0]?.rawIdentification ?? null,
  );
  if (!identity) return null;

  const affiliateEntries = operationalEntries.filter(
    (entry) => entry.source.sourceModel === 'Affiliate',
  );

  return {
    identification: identity.rawIdentification,
    identificationType: identity.identificationType,
    normalizedIdentification: identity.normalizedIdentification,
    legacyFullName: firstPresent(
      operationalEntries.map((entry) => entry.source.fullName),
    ),
    birthDate: firstPresent(
      operationalEntries.map((entry) => entry.source.birthDate),
    ),
    // User email remains an account identifier. Only affiliation contact email
    // can seed Person.email during this transitional backfill.
    email: firstPresent(affiliateEntries.map((entry) => entry.source.email)),
    phoneCountryCode: firstPresent(
      operationalEntries.map((entry) => entry.source.phoneCountryCode),
    ),
    phoneNationalNumber: firstPresent(
      operationalEntries.map((entry) => entry.source.phoneNationalNumber),
    ),
    address: firstPresent(
      operationalEntries.map((entry) => entry.source.address),
    ),
  };
}

export function sourceFingerprint(source: IdentitySource): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        sourceModel: source.sourceModel,
        sourceId: source.sourceId,
        identification: source.identification,
        identificationType: source.identificationType,
        fullName: source.fullName,
        birthDate: source.birthDate?.toISOString() ?? null,
        email: source.email,
        phoneCountryCode: source.phoneCountryCode,
        phoneNationalNumber: source.phoneNationalNumber,
        address: source.address,
      }),
    )
    .digest('hex');
}

function toEntry(source: IdentitySource): ReconciliationEntry {
  const normalized = normalizeIdentification(
    source.identificationType,
    source.identification,
  );
  return {
    source,
    rawIdentification:
      normalized?.rawIdentification ?? source.identification?.trim() ?? null,
    identificationType: normalized?.identificationType ?? null,
    normalizedIdentification: normalized?.normalizedIdentification ?? null,
    identityClusterKey: normalized
      ? `${normalized.identificationType}:${normalized.normalizedIdentification}`
      : null,
    classification: 'IDENTITY_INCOMPLETE',
    personCreationAllowed: false,
    conflictCodes: [],
    nameReconciliationRequired: false,
    reviewRequired: false,
  };
}

function classifyCluster(
  identityClusterKey: string,
  entries: ReconciliationEntry[],
): ReconciliationCluster {
  const operationalEntries = entries.filter(isOperationalEntry);
  const conflictCodes = collectClusterConflicts(operationalEntries);
  const hasOperationalSource = operationalEntries.length > 0;
  const hasConflict = conflictCodes.length > 0;
  const classification: IdentityClassification = hasConflict
    ? conflictCodes.some((code) => code.endsWith('_DUPLICATE'))
      ? 'IDENTITY_DUPLICATE'
      : 'IDENTITY_CONFLICT'
    : hasOperationalSource && operationalEntries.length > 1
      ? 'IDENTITY_MATCH'
      : 'IDENTITY_NOT_FOUND';
  const personCreationAllowed = hasOperationalSource && !hasConflict;
  const nameReconciliationRequired = personCreationAllowed;
  const reviewRequired = hasConflict;

  return {
    identityClusterKey,
    classification,
    personCreationAllowed,
    conflictCodes,
    nameReconciliationRequired,
    reviewRequired,
    entries: entries.map((entry) => ({
      ...entry,
      classification,
      personCreationAllowed: personCreationAllowed && isOperationalEntry(entry),
      conflictCodes,
      nameReconciliationRequired:
        nameReconciliationRequired && isOperationalEntry(entry),
      reviewRequired,
    })),
  };
}

function collectClusterConflicts(entries: ReconciliationEntry[]): string[] {
  const conflicts: string[] = [];
  for (const sourceModel of ['User', 'Affiliate'] as const) {
    if (
      entries.filter((entry) => entry.source.sourceModel === sourceModel)
        .length > 1
    ) {
      conflicts.push(`${sourceModel.toUpperCase()}_DUPLICATE`);
    }
  }
  if (
    hasDifferentNonNull(
      entries.map((entry) => entry.source.birthDate?.toISOString() ?? null),
    )
  ) {
    conflicts.push('BIRTHDATE_CONFLICT');
  }
  if (
    hasDifferentNonNull(
      entries.map((entry) => normalizeName(entry.source.fullName)),
    )
  ) {
    conflicts.push('LEGACY_FULLNAME_CONFLICT');
  }
  if (
    hasDifferentNonNull(
      entries.map((entry) => normalizeText(entry.source.phoneCountryCode)),
    )
  ) {
    conflicts.push('PHONE_COUNTRY_CODE_CONFLICT');
  }
  if (
    hasDifferentNonNull(
      entries.map((entry) => normalizeText(entry.source.phoneNationalNumber)),
    )
  ) {
    conflicts.push('PHONE_NATIONAL_NUMBER_CONFLICT');
  }
  if (
    hasDifferentNonNull(
      entries.map((entry) => normalizeText(entry.source.address)),
    )
  ) {
    conflicts.push('ADDRESS_CONFLICT');
  }
  return conflicts;
}

function applyCrossIdentityManualReview(
  clusters: ReconciliationCluster[],
): void {
  const operationalEntries = clusters
    .flatMap((cluster) => cluster.entries)
    .filter(isOperationalEntry);
  const byEmail = new Map<string, ReconciliationEntry[]>();
  const byRawIdentification = new Map<string, ReconciliationEntry[]>();

  for (const entry of operationalEntries) {
    const email = normalizeText(entry.source.email)?.toLocaleLowerCase('en-US');
    if (email) addToGroup(byEmail, email, entry);
    if (entry.rawIdentification)
      addToGroup(byRawIdentification, entry.rawIdentification, entry);
  }

  markDifferentIdentityGroups(byEmail, 'EMAIL_DIFFERENT_IDENTITY_KEY');
  markDifferentIdentityGroups(
    byRawIdentification,
    'RAW_IDENTIFICATION_DIFFERENT_TYPE',
  );

  for (const cluster of clusters) {
    const requiresCrossIdentityReview = cluster.entries.some((entry) =>
      entry.conflictCodes.some(
        (code) =>
          code === 'EMAIL_DIFFERENT_IDENTITY_KEY' ||
          code === 'RAW_IDENTIFICATION_DIFFERENT_TYPE',
      ),
    );
    if (!requiresCrossIdentityReview) continue;
    cluster.classification = 'MANUAL_REVIEW_REQUIRED';
    cluster.personCreationAllowed = false;
    cluster.reviewRequired = true;
    cluster.conflictCodes = uniqueCodes(
      cluster.entries.flatMap((entry) => entry.conflictCodes),
    );
    cluster.entries = cluster.entries.map((entry) => ({
      ...entry,
      classification: 'MANUAL_REVIEW_REQUIRED',
      personCreationAllowed: false,
      reviewRequired: true,
      conflictCodes: cluster.conflictCodes,
    }));
  }
}

function markDifferentIdentityGroups(
  groups: Map<string, ReconciliationEntry[]>,
  conflictCode: string,
): void {
  for (const entries of groups.values()) {
    const keys = new Set(entries.map((entry) => entry.identityClusterKey));
    if (keys.size < 2) continue;
    for (const entry of entries) {
      entry.conflictCodes = uniqueCodes([...entry.conflictCodes, conflictCode]);
      entry.reviewRequired = true;
    }
  }
}

function isOperationalEntry(entry: ReconciliationEntry): boolean {
  return (
    entry.source.sourceModel === 'User' ||
    entry.source.sourceModel === 'Affiliate'
  );
}

function isSupportedIdentificationType(
  value: string | null,
): value is SupportedIdentificationType {
  return value === 'NATIONAL' || value === 'DIMEX';
}

function normalizeName(value: string | null): string | null {
  return normalizeText(value)?.toLocaleLowerCase('es-CR') ?? null;
}

function normalizeText(value: string | null): string | null {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function hasDifferentNonNull(values: readonly (string | null)[]): boolean {
  return (
    new Set(values.filter((value): value is string => value !== null)).size > 1
  );
}

function firstPresent<T>(values: readonly (T | null)[]): T | null {
  return values.find((value): value is T => value !== null) ?? null;
}

function addToGroup(
  groups: Map<string, ReconciliationEntry[]>,
  key: string,
  entry: ReconciliationEntry,
): void {
  const entries = groups.get(key) ?? [];
  entries.push(entry);
  groups.set(key, entries);
}

function uniqueCodes(codes: readonly string[]): string[] {
  return [...new Set(codes)].sort();
}

function compareClusters(
  left: ReconciliationCluster,
  right: ReconciliationCluster,
): number {
  const leftKey =
    left.identityClusterKey ??
    `${left.entries[0]?.source.sourceModel}:${left.entries[0]?.source.sourceId}`;
  const rightKey =
    right.identityClusterKey ??
    `${right.entries[0]?.source.sourceModel}:${right.entries[0]?.source.sourceId}`;
  return leftKey.localeCompare(rightKey);
}
