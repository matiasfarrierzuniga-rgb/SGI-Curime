import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../generated/prisma/client';
import {
  IDENTITY_NORMALIZATION_VERSION,
  RECONCILIATION_DECISION_VERSION,
  RECONCILIATION_MANIFEST_VERSION,
  createPersonBackfillData,
  reconcileIdentitySources,
  sourceFingerprint,
  type IdentitySource,
  type ReconciliationCluster,
} from '../src/identity-reconciliation/identity-reconciliation';

const ADVISORY_LOCK_ID = 915202605;

interface RunSummary {
  personRowsAtStart: number;
  totalUsers: number;
  totalAffiliates: number;
  totalUserRequests: number;
  totalAffiliateRequests: number;
  completeIdentityKeys: number;
  incompleteIdentityKeys: number;
  malformedIdentities: number;
  normalizationCollisions: number;
  userDuplicateIdentityKeys: number;
  affiliateDuplicateIdentityKeys: number;
  userAffiliateMatchingKeys: number;
  compatibleMatches: number;
  conflictingMatches: number;
  sameEmailDifferentIdentityKey: number;
  sameRawIdDifferentType: number;
  legacyFullNameOnlyCases: number;
  personRowsCreated: number;
  personRowsAfter: number;
  nameReconciliationRequiredCount: number;
  manualReviewCaseCount: number;
  clusters: ReconciliationCluster[];
  selectedPersonIds: Record<string, number | null>;
}

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function requiredManifestPath(): string {
  const args = process.argv.slice(2);
  const optionIndex = args.indexOf('--manifest');
  const fromArgument = optionIndex >= 0 ? args[optionIndex + 1] : undefined;
  const path = fromArgument ?? process.env.RECONCILIATION_MANIFEST_PATH;
  if (!path) {
    throw new Error(
      'Provide --manifest <path> or RECONCILIATION_MANIFEST_PATH for the reconciliation export.',
    );
  }
  return resolve(path);
}

function assertWriteProtection(): void {
  const target = process.env.IDENTITY_RECONCILIATION_DATABASE;
  const protection = process.env.IDENTITY_RECONCILIATION_WRITE_PROTECTION;
  if (target !== 'isolated' && target !== 'development') {
    throw new Error(
      'IDENTITY_RECONCILIATION_DATABASE must be isolated or development.',
    );
  }
  if (protection !== 'isolated' && protection !== 'maintenance-freeze') {
    throw new Error(
      'IDENTITY_RECONCILIATION_WRITE_PROTECTION must be isolated or maintenance-freeze.',
    );
  }
}

async function main(): Promise<void> {
  assertWriteProtection();
  const manifestPath = requiredManifestPath();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: requiredEnvironmentVariable('DATABASE_URL'),
    }),
  });

  try {
    const summary = await reconcileWithRetry(prisma);
    await mkdir(dirname(manifestPath), { recursive: true });
    await writeFile(
      manifestPath,
      `${JSON.stringify(toManifestExport(summary), null, 2)}\n`,
      'utf8',
    );
    console.log(
      `Reconciliation complete: ${summary.personRowsCreated} Person rows created; ${summary.manualReviewCaseCount} manual-review cases.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function reconcileWithRetry(prisma: PrismaClient): Promise<RunSummary> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => reconcile(tx), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (!isTransactionWriteConflict(error) || attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }
  throw new Error('Identity reconciliation retry budget exhausted.');
}

async function reconcile(tx: Prisma.TransactionClient): Promise<RunSummary> {
  await tx.$executeRawUnsafe(
    `SELECT pg_advisory_xact_lock(${ADVISORY_LOCK_ID})`,
  );
  const [users, affiliates, userRequests, affiliateRequests, existingPeople] =
    await Promise.all([
      tx.user.findMany({
        select: {
          id: true,
          identification: true,
          identificationType: true,
          fullName: true,
          email: true,
          phoneCountryCode: true,
          phoneNationalNumber: true,
          address: true,
        },
      }),
      tx.affiliate.findMany({
        select: {
          id: true,
          identification: true,
          identificationType: true,
          fullName: true,
          birthDate: true,
          email: true,
          phoneCountryCode: true,
          phoneNationalNumber: true,
          address: true,
        },
      }),
      tx.userRequest.findMany({
        select: {
          id: true,
          identification: true,
          identificationType: true,
          fullName: true,
          email: true,
          phoneCountryCode: true,
          phoneNationalNumber: true,
          address: true,
        },
      }),
      tx.affiliateRequest.findMany({
        select: {
          id: true,
          identification: true,
          identificationType: true,
          fullName: true,
          birthDate: true,
          email: true,
          phoneCountryCode: true,
          phoneNationalNumber: true,
          address: true,
        },
      }),
      tx.person.findMany({ select: { id: true } }),
    ]);

  const sources: IdentitySource[] = [
    ...users.map((row) => toSource(row, 'User', null)),
    ...affiliates.map((row) => toSource(row, 'Affiliate', row.birthDate)),
    ...userRequests.map((row) => toSource(row, 'UserRequest', null)),
    ...affiliateRequests.map((row) =>
      toSource(row, 'AffiliateRequest', row.birthDate),
    ),
  ];
  const clusters = reconcileIdentitySources(sources);
  const manifestRows = await tx.identityReconciliationManifest.findMany({
    select: { selectedPersonId: true },
  });
  assertExistingPeopleHaveManifestProvenance(existingPeople, manifestRows);

  const selectedPersonIds: Record<string, number | null> = {};
  let personRowsCreated = 0;

  for (const cluster of clusters) {
    const clusterKey = cluster.identityClusterKey ?? clusterEntryKey(cluster);
    let selectedPersonId: number | null = null;
    if (cluster.personCreationAllowed) {
      selectedPersonId = await resolveOrCreatePerson(tx, cluster);
      if (selectedPersonId === null) {
        throw new Error(
          `Safe reconciliation cluster ${clusterKey} could not resolve a Person.`,
        );
      }
      const existingSelections =
        await tx.identityReconciliationManifest.findMany({
          where: { identityClusterKey: cluster.identityClusterKey },
          select: { selectedPersonId: true },
        });
      if (
        !existingSelections.some(
          (entry) => entry.selectedPersonId === selectedPersonId,
        )
      ) {
        personRowsCreated += 1;
      }
    }
    selectedPersonIds[clusterKey] = selectedPersonId;

    for (const entry of cluster.entries) {
      const source = entry.source;
      await tx.identityReconciliationManifest.upsert({
        where: {
          normalizationVersion_decisionVersion_sourceModel_sourceId: {
            normalizationVersion: IDENTITY_NORMALIZATION_VERSION,
            decisionVersion: RECONCILIATION_DECISION_VERSION,
            sourceModel: source.sourceModel,
            sourceId: source.sourceId,
          },
        },
        create: manifestData(entry, selectedPersonId),
        update: manifestData(entry, selectedPersonId),
      });
    }
  }

  const personRowsAfter = await tx.person.count();
  return summarize(
    sources,
    clusters,
    existingPeople.length,
    personRowsCreated,
    personRowsAfter,
    selectedPersonIds,
  );
}

function toSource(
  row: {
    id: number;
    identification: string;
    identificationType: string | null;
    fullName: string;
    email: string | null;
    phoneCountryCode: string | null;
    phoneNationalNumber: string | null;
    address: string | null;
  },
  sourceModel: IdentitySource['sourceModel'],
  birthDate: Date | null,
): IdentitySource {
  return {
    sourceModel,
    sourceId: row.id,
    identification: row.identification,
    identificationType: row.identificationType,
    fullName: row.fullName,
    birthDate,
    email: row.email,
    phoneCountryCode: row.phoneCountryCode,
    phoneNationalNumber: row.phoneNationalNumber,
    address: row.address,
  };
}

async function resolveOrCreatePerson(
  tx: Prisma.TransactionClient,
  cluster: ReconciliationCluster,
): Promise<number | null> {
  const firstEntry = cluster.entries[0];
  if (
    !cluster.identityClusterKey ||
    !firstEntry?.identificationType ||
    !firstEntry.normalizedIdentification
  ) {
    return null;
  }
  const priorEntries = await tx.identityReconciliationManifest.findMany({
    where: { identityClusterKey: cluster.identityClusterKey },
    select: { selectedPersonId: true },
  });
  const selectedIds = [
    ...new Set(
      priorEntries
        .map((entry) => entry.selectedPersonId)
        .filter((id): id is number => id !== null),
    ),
  ];
  if (selectedIds.length > 1) {
    throw new Error(
      `Manifest has conflicting Person selections for ${cluster.identityClusterKey}.`,
    );
  }
  if (selectedIds.length === 1) return selectedIds[0];

  const existingPeople = await tx.person.findMany({
    where: {
      identificationType: firstEntry.identificationType,
      normalizedIdentification: firstEntry.normalizedIdentification,
    },
    select: { id: true },
  });
  if (existingPeople.length > 0) {
    throw new Error(
      `Person identity ${cluster.identityClusterKey} has no manifest provenance and requires review.`,
    );
  }

  const data = createPersonBackfillData(cluster);
  if (!data) return null;
  const person = await tx.person.create({ data });
  return person.id;
}

function manifestData(
  entry: ReconciliationCluster['entries'][number],
  selectedPersonId: number | null,
) {
  return {
    manifestVersion: RECONCILIATION_MANIFEST_VERSION,
    normalizationVersion: IDENTITY_NORMALIZATION_VERSION,
    decisionVersion: RECONCILIATION_DECISION_VERSION,
    sourceModel: entry.source.sourceModel,
    sourceId: entry.source.sourceId,
    sourceFingerprint: sourceFingerprint(entry.source),
    rawIdentification: entry.rawIdentification,
    identificationType: entry.identificationType,
    normalizedIdentification: entry.normalizedIdentification,
    identityClusterKey: entry.identityClusterKey,
    classification: entry.classification,
    selectedPersonId,
    personCreationAllowed: entry.personCreationAllowed,
    conflictCodes: entry.conflictCodes,
    nameReconciliationRequired: entry.nameReconciliationRequired,
    reviewRequired: entry.reviewRequired,
    sourceSnapshot: sourceSnapshot(entry.source),
  };
}

function sourceSnapshot(source: IdentitySource): Prisma.InputJsonValue {
  return {
    sourceModel: source.sourceModel,
    sourceId: source.sourceId,
    fullName: source.fullName,
    birthDate: source.birthDate?.toISOString() ?? null,
    email: source.email,
    phoneCountryCode: source.phoneCountryCode,
    phoneNationalNumber: source.phoneNationalNumber,
    address: source.address,
  };
}

function assertExistingPeopleHaveManifestProvenance(
  people: readonly { id: number }[],
  manifestRows: readonly { selectedPersonId: number | null }[],
): void {
  const selectedPersonIds = new Set(
    manifestRows
      .map((entry) => entry.selectedPersonId)
      .filter((id): id is number => id !== null),
  );
  const withoutProvenance = people.filter(
    (person) => !selectedPersonIds.has(person.id),
  );
  if (withoutProvenance.length > 0) {
    throw new Error(
      'Existing Person rows without reconciliation manifest provenance were found.',
    );
  }
}

function summarize(
  sources: readonly IdentitySource[],
  clusters: readonly ReconciliationCluster[],
  personRowsAtStart: number,
  personRowsCreated: number,
  personRowsAfter: number,
  selectedPersonIds: Record<string, number | null>,
): RunSummary {
  const entries = clusters.flatMap((cluster) => cluster.entries);
  const completeEntries = entries.filter((entry) => entry.identityClusterKey);
  const incompleteEntries = entries.filter(
    (entry) => !entry.identityClusterKey,
  );
  const userAffiliateMatchingKeys = clusters.filter(
    (cluster) =>
      cluster.entries.some((entry) => entry.source.sourceModel === 'User') &&
      cluster.entries.some((entry) => entry.source.sourceModel === 'Affiliate'),
  ).length;
  const allCodes = entries.flatMap((entry) => entry.conflictCodes);
  return {
    personRowsAtStart,
    totalUsers: sources.filter((source) => source.sourceModel === 'User')
      .length,
    totalAffiliates: sources.filter(
      (source) => source.sourceModel === 'Affiliate',
    ).length,
    totalUserRequests: sources.filter(
      (source) => source.sourceModel === 'UserRequest',
    ).length,
    totalAffiliateRequests: sources.filter(
      (source) => source.sourceModel === 'AffiliateRequest',
    ).length,
    completeIdentityKeys: completeEntries.length,
    incompleteIdentityKeys: incompleteEntries.length,
    malformedIdentities: incompleteEntries.length,
    normalizationCollisions: clusters.filter((cluster) =>
      cluster.conflictCodes.includes('RAW_IDENTIFICATION_DIFFERENT_TYPE'),
    ).length,
    userDuplicateIdentityKeys: countCode(allCodes, 'USER_DUPLICATE'),
    affiliateDuplicateIdentityKeys: countCode(allCodes, 'AFFILIATE_DUPLICATE'),
    userAffiliateMatchingKeys,
    compatibleMatches: clusters.filter(
      (cluster) => cluster.classification === 'IDENTITY_MATCH',
    ).length,
    conflictingMatches: clusters.filter(
      (cluster) => cluster.classification === 'IDENTITY_CONFLICT',
    ).length,
    sameEmailDifferentIdentityKey: countCode(
      allCodes,
      'EMAIL_DIFFERENT_IDENTITY_KEY',
    ),
    sameRawIdDifferentType: countCode(
      allCodes,
      'RAW_IDENTIFICATION_DIFFERENT_TYPE',
    ),
    legacyFullNameOnlyCases: clusters.filter(
      (cluster) => cluster.nameReconciliationRequired,
    ).length,
    personRowsCreated,
    personRowsAfter,
    nameReconciliationRequiredCount: clusters.filter(
      (cluster) => cluster.nameReconciliationRequired,
    ).length,
    manualReviewCaseCount: clusters.filter((cluster) => cluster.reviewRequired)
      .length,
    clusters: [...clusters],
    selectedPersonIds,
  };
}

function toManifestExport(summary: RunSummary) {
  return {
    manifestVersion: RECONCILIATION_MANIFEST_VERSION,
    normalizationVersion: IDENTITY_NORMALIZATION_VERSION,
    decisionVersion: RECONCILIATION_DECISION_VERSION,
    summary: {
      ...summary,
      clusters: undefined,
      selectedPersonIds: undefined,
    },
    clusters: summary.clusters.map((cluster) => ({
      identityClusterKey: cluster.identityClusterKey,
      classification: cluster.classification,
      personCreationAllowed: cluster.personCreationAllowed,
      conflictCodes: cluster.conflictCodes,
      nameReconciliationRequired: cluster.nameReconciliationRequired,
      reviewRequired: cluster.reviewRequired,
      selectedPersonId:
        summary.selectedPersonIds[
          cluster.identityClusterKey ?? clusterEntryKey(cluster)
        ] ?? null,
      entries: cluster.entries.map((entry) => ({
        sourceModel: entry.source.sourceModel,
        sourceId: entry.source.sourceId,
        rawIdentification: entry.rawIdentification,
        identificationType: entry.identificationType,
        normalizedIdentification: entry.normalizedIdentification,
        classification: entry.classification,
        conflictCodes: entry.conflictCodes,
        nameReconciliationRequired: entry.nameReconciliationRequired,
        reviewRequired: entry.reviewRequired,
        evidence: sourceSnapshot(entry.source),
      })),
    })),
  };
}

function countCode(codes: readonly string[], code: string): number {
  return new Set(codes.filter((candidate) => candidate === code)).size;
}

function clusterEntryKey(cluster: ReconciliationCluster): string {
  const entry = cluster.entries[0];
  return `incomplete:${entry?.source.sourceModel}:${entry?.source.sourceId}`;
}

function isTransactionWriteConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2034'
  );
}

main().catch((error: unknown) => {
  console.error('Identity reconciliation failed.', error);
  process.exitCode = 1;
});
