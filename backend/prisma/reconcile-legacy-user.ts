import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../generated/prisma/client';
import {
  IDENTITY_NORMALIZATION_VERSION,
  RECONCILIATION_DECISION_VERSION,
  RECONCILIATION_MANIFEST_VERSION,
} from '../src/identity-reconciliation/identity-reconciliation';
import {
  MANUAL_RECONCILIATION_REVIEWER,
  buildManualReconciliationPlan,
  isCurrentConfirmationFingerprint,
  isCurrentSourceFingerprint,
  parseManualReconciliationArgs,
  safeManualPlanReport,
  type ManualLegacyUser,
  type ManualPersonCandidate,
  type ManualReconciliationInput,
  type ManualReconciliationPlan,
} from '../src/identity-reconciliation/manual-legacy-user-reconciliation';

const ADVISORY_LOCK_ID = 915202605;

export interface DatabaseState {
  user: ManualLegacyUser | null;
  people: ManualPersonCandidate[];
  targetUserCount: number;
  totalUsers: number;
  totalAffiliates: number;
  totalPeople: number;
  totalUserRequests: number;
  totalAffiliateRequests: number;
  totalManifestRows: number;
}

export interface ApplyResult {
  plan: ManualReconciliationPlan;
  personCreated: number;
  personReused: number;
  userLinkCreated: number;
}

async function main(): Promise<void> {
  const input = parseManualReconciliationArgs(process.argv.slice(2));
  if (input.apply) {
    assertApplyWriteProtection();
    console.log('REAL_WRITE_REQUESTED=YES');
  }
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: requiredDatabaseUrl() }),
  });

  try {
    if (!input.apply) {
      const state = await readState(prisma, input);
      printReport(
        'DRY_RUN',
        state,
        buildManualReconciliationPlan(state.user, state.people, input),
      );
      return;
    }
    const result = await applyWithRetry(prisma, input);
    const state = await readState(prisma, input);
    const verifiedPlan = buildManualReconciliationPlan(
      state.user,
      state.people,
      input,
    );
    printReport('APPLY', state, verifiedPlan, result);
  } finally {
    await prisma.$disconnect();
  }
}

export async function readState(
  prisma: PrismaClient | Prisma.TransactionClient,
  input: ManualReconciliationInput,
): Promise<DatabaseState> {
  const [
    users,
    totalUsers,
    totalAffiliates,
    totalPeople,
    totalUserRequests,
    totalAffiliateRequests,
    totalManifestRows,
  ] = await Promise.all([
    prisma.user.findMany({ where: { id: input.userId }, select: userSelect }),
    prisma.user.count(),
    prisma.affiliate.count(),
    prisma.person.count(),
    prisma.userRequest.count(),
    prisma.affiliateRequest.count(),
    prisma.identityReconciliationManifest.count(),
  ]);
  const user = users.length === 1 ? toManualUser(users[0]) : null;
  const normalized = user
    ? buildManualReconciliationPlan(user, [], input).normalizedIdentification
    : null;
  const rawIdentityPeople = user?.identification?.trim()
    ? await prisma.$queryRaw<{ id: number }[]>(
        Prisma.sql`SELECT "id" FROM "Person" WHERE btrim("identification") = ${user.identification.trim()}`,
      )
    : [];
  const people = user
    ? await prisma.person.findMany({
        where: {
          OR: [
            ...(normalized
              ? [
                  {
                    identificationType: input.identificationType,
                    normalizedIdentification: normalized,
                  },
                ]
              : []),
            ...(rawIdentityPeople.length > 0
              ? [{ id: { in: rawIdentityPeople.map((person) => person.id) } }]
              : []),
            ...(user.personId !== null ? [{ id: user.personId }] : []),
          ],
        },
        select: personSelect,
      })
    : [];
  return {
    user,
    people: people.map(toPersonCandidate),
    targetUserCount: users.length,
    totalUsers,
    totalAffiliates,
    totalPeople,
    totalUserRequests,
    totalAffiliateRequests,
    totalManifestRows,
  };
}

export async function applyWithRetry(
  prisma: PrismaClient,
  input: ManualReconciliationInput,
): Promise<ApplyResult> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction((tx) => applyReconciliation(tx, input), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (!isTransactionWriteConflict(error) || attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }
  throw new Error('Manual reconciliation retry budget exhausted.');
}

async function applyReconciliation(
  tx: Prisma.TransactionClient,
  input: ManualReconciliationInput,
): Promise<ApplyResult> {
  await tx.$executeRawUnsafe(
    `SELECT pg_advisory_xact_lock(${ADVISORY_LOCK_ID})`,
  );
  await tx.$executeRawUnsafe('LOCK TABLE "Person" IN SHARE ROW EXCLUSIVE MODE');
  const state = await readState(tx, input);
  let plan = buildManualReconciliationPlan(state.user, state.people, input);
  if (!isCurrentSourceFingerprint(plan, input.expectedSourceFingerprint)) {
    throw new Error('STALE_SOURCE');
  }
  if (
    plan.status !== 'ALREADY_RECONCILED' &&
    !isCurrentConfirmationFingerprint(
      plan,
      input.expectedConfirmationFingerprint,
    )
  ) {
    throw new Error('STALE_CONFIRMATION');
  }
  if (!plan.applySafe) throw new Error(plan.reason ?? 'RECONCILIATION_BLOCKED');
  const existingManifest = await tx.identityReconciliationManifest.findUnique({
    where: {
      normalizationVersion_decisionVersion_sourceModel_sourceId: {
        normalizationVersion: IDENTITY_NORMALIZATION_VERSION,
        decisionVersion: RECONCILIATION_DECISION_VERSION,
        sourceModel: 'User',
        sourceId: input.userId,
      },
    },
    select: {
      manifestVersion: true,
      normalizationVersion: true,
      decisionVersion: true,
      sourceModel: true,
      sourceId: true,
      selectedPersonId: true,
      sourceFingerprint: true,
      rawIdentification: true,
      identificationType: true,
      normalizedIdentification: true,
      identityClusterKey: true,
      classification: true,
      personCreationAllowed: true,
      conflictCodes: true,
      nameReconciliationRequired: true,
      reviewRequired: true,
      sourceSnapshot: true,
      reviewedAt: true,
      reviewedBy: true,
    },
  });
  if (plan.status === 'ALREADY_RECONCILED') {
    if (
      !existingManifest ||
      !isValidReviewedManifest(existingManifest, state.user, input, plan)
    ) {
      throw new Error('MANIFEST_PROVENANCE_INVALID');
    }
    return { plan, personCreated: 0, personReused: 0, userLinkCreated: 0 };
  }
  if (!state.user || !plan.normalizedIdentification) {
    throw new Error('RECONCILIATION_SOURCE_INVALID');
  }
  if (
    existingManifest?.selectedPersonId !== null &&
    existingManifest?.selectedPersonId !== undefined &&
    existingManifest.selectedPersonId !== plan.selectedPersonId
  ) {
    throw new Error('MANIFEST_PERSON_SELECTION_CONFLICT');
  }

  let personId = plan.selectedPersonId;
  let personCreated = 0;
  let personReused = 0;
  if (personId === null) {
    const person = await tx.person.create({
      data: {
        firstName: input.firstName,
        firstSurname: input.firstSurname,
        secondSurname: input.secondSurname,
        legacyFullName: state.user.fullName,
        identification: state.user.identification,
        identificationType: input.identificationType,
        normalizedIdentification: plan.normalizedIdentification,
      },
      select: { id: true },
    });
    personId = person.id;
    personCreated = 1;
  } else {
    personReused = 1;
  }

  await tx.identityReconciliationManifest.upsert({
    where: {
      normalizationVersion_decisionVersion_sourceModel_sourceId: {
        normalizationVersion: IDENTITY_NORMALIZATION_VERSION,
        decisionVersion: RECONCILIATION_DECISION_VERSION,
        sourceModel: 'User',
        sourceId: input.userId,
      },
    },
    create: manifestData(state.user, input, plan, personId),
    update: manifestData(state.user, input, plan, personId),
  });
  const linked = await tx.$executeRaw(
    Prisma.sql`UPDATE "User" SET "personId" = ${personId} WHERE "id" = ${input.userId} AND "personId" IS NULL`,
  );
  if (linked !== 1) throw new Error('TARGET_USER_CHANGED_DURING_APPLY');
  const verified = await tx.user.findUnique({
    where: { id: input.userId },
    select: { personId: true },
  });
  if (verified?.personId !== personId)
    throw new Error('USER_LINK_VERIFICATION_FAILED');
  plan = { ...plan, selectedPersonId: personId };
  return { plan, personCreated, personReused, userLinkCreated: 1 };
}

function manifestData(
  user: ManualLegacyUser,
  input: ManualReconciliationInput,
  plan: ManualReconciliationPlan,
  selectedPersonId: number,
) {
  return {
    manifestVersion: RECONCILIATION_MANIFEST_VERSION,
    normalizationVersion: IDENTITY_NORMALIZATION_VERSION,
    decisionVersion: RECONCILIATION_DECISION_VERSION,
    sourceModel: 'User',
    sourceId: user.sourceId,
    sourceFingerprint: plan.sourceFingerprint!,
    rawIdentification: user.identification,
    identificationType: input.identificationType,
    normalizedIdentification: plan.normalizedIdentification,
    identityClusterKey: `${input.identificationType}:${plan.normalizedIdentification}`,
    classification: plan.personCreationRequired
      ? 'IDENTITY_NOT_FOUND'
      : 'IDENTITY_MATCH',
    selectedPersonId,
    personCreationAllowed: true,
    conflictCodes: [],
    nameReconciliationRequired: false,
    reviewRequired: false,
    sourceSnapshot: {
      sourceModel: 'User',
      sourceId: user.sourceId,
      fullName: user.fullName,
      confirmedStructuredName: {
        firstName: input.firstName,
        firstSurname: input.firstSurname,
        secondSurname: input.secondSurname,
      },
      identificationTypeConfirmed: true,
      structuredNameConfirmed: true,
      identificationTypeInferred: false,
      fullNameAutoParsed: false,
    },
    reviewedAt: new Date(),
    reviewedBy: MANUAL_RECONCILIATION_REVIEWER,
  };
}

function isValidReviewedManifest(
  manifest: {
    manifestVersion: string;
    normalizationVersion: string;
    decisionVersion: string;
    sourceModel: string;
    sourceId: number;
    selectedPersonId: number | null;
    sourceFingerprint: string;
    rawIdentification: string | null;
    identificationType: string | null;
    normalizedIdentification: string | null;
    identityClusterKey: string | null;
    classification: string;
    personCreationAllowed: boolean;
    conflictCodes: unknown;
    nameReconciliationRequired: boolean;
    reviewRequired: boolean;
    sourceSnapshot: unknown;
    reviewedAt: Date | null;
    reviewedBy: string | null;
  },
  user: ManualLegacyUser | null,
  input: ManualReconciliationInput,
  plan: ManualReconciliationPlan,
): boolean {
  if (!user || !plan.normalizedIdentification) return false;
  const expectedSnapshot = {
    sourceModel: 'User',
    sourceId: user.sourceId,
    fullName: user.fullName,
    confirmedStructuredName: {
      firstName: input.firstName,
      firstSurname: input.firstSurname,
      secondSurname: input.secondSurname,
    },
    identificationTypeConfirmed: true,
    structuredNameConfirmed: true,
    identificationTypeInferred: false,
    fullNameAutoParsed: false,
  };
  return (
    manifest.manifestVersion === RECONCILIATION_MANIFEST_VERSION &&
    manifest.normalizationVersion === IDENTITY_NORMALIZATION_VERSION &&
    manifest.decisionVersion === RECONCILIATION_DECISION_VERSION &&
    manifest.sourceModel === 'User' &&
    manifest.sourceId === user.sourceId &&
    manifest.selectedPersonId === plan.selectedPersonId &&
    manifest.sourceFingerprint === plan.sourceFingerprint &&
    manifest.rawIdentification === user.identification &&
    manifest.identificationType === input.identificationType &&
    manifest.normalizedIdentification === plan.normalizedIdentification &&
    manifest.identityClusterKey ===
      `${input.identificationType}:${plan.normalizedIdentification}` &&
    (manifest.classification === 'IDENTITY_NOT_FOUND' ||
      manifest.classification === 'IDENTITY_MATCH') &&
    manifest.personCreationAllowed &&
    JSON.stringify(manifest.conflictCodes) === '[]' &&
    !manifest.nameReconciliationRequired &&
    !manifest.reviewRequired &&
    canonicalJson(manifest.sourceSnapshot) ===
      canonicalJson(expectedSnapshot) &&
    manifest.reviewedAt !== null &&
    manifest.reviewedBy === MANUAL_RECONCILIATION_REVIEWER
  );
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function printReport(
  mode: 'DRY_RUN' | 'APPLY',
  state: DatabaseState,
  plan: ManualReconciliationPlan,
  result?: ApplyResult,
): void {
  const lines: Record<string, string | number> = {
    MODE: mode,
    WRITE_EXECUTED:
      mode === 'APPLY' && result?.userLinkCreated === 1 ? 'YES' : 'NO',
    TARGET_USER_FOUND: state.user ? 'YES' : 'NO',
    TARGET_USER_COUNT: state.targetUserCount,
    USER_ALREADY_LINKED:
      state.user !== null && state.user.personId !== null ? 'YES' : 'NO',
    IDENTIFICATION_PRESENT: state.user?.identification?.trim() ? 'YES' : 'NO',
    IDENTIFICATION_TYPE_INPUT: 'NATIONAL',
    NORMALIZATION_VALID: plan.normalizedIdentification ? 'YES' : 'NO',
    SOURCE_STATE_CURRENT: plan.sourceFingerprint ? 'YES' : 'NO',
    ...safeManualPlanReport(plan),
    PERSON_CREATED: result?.personCreated ?? 0,
    PERSON_REUSED: result?.personReused ?? 0,
    USER_LINK_CREATED: result?.userLinkCreated ?? 0,
    TOTAL_USERS: state.totalUsers,
    TOTAL_AFFILIATES: state.totalAffiliates,
    TOTAL_PERSONS: state.totalPeople,
    TOTAL_USER_REQUESTS: state.totalUserRequests,
    TOTAL_AFFILIATE_REQUESTS: state.totalAffiliateRequests,
    MANIFEST_ROWS: state.totalManifestRows,
  };
  for (const [key, value] of Object.entries(lines))
    console.log(`${key}=${value}`);
}

function toManualUser(row: UserRow): ManualLegacyUser {
  return {
    sourceModel: 'User',
    sourceId: row.id,
    personId: row.personId,
    identification: row.identification,
    identificationType: row.identificationType,
    fullName: row.fullName,
    birthDate: null,
    email: row.email,
    phoneCountryCode: row.phoneCountryCode,
    phoneNationalNumber: row.phoneNationalNumber,
    address: row.address,
  };
}

function toPersonCandidate(row: PersonRow): ManualPersonCandidate {
  return { ...row, linkedUserId: row.user?.id ?? null };
}

const userSelect = {
  id: true,
  personId: true,
  identification: true,
  identificationType: true,
  fullName: true,
  email: true,
  phoneCountryCode: true,
  phoneNationalNumber: true,
  address: true,
} as const;

const personSelect = {
  id: true,
  identification: true,
  identificationType: true,
  normalizedIdentification: true,
  firstName: true,
  firstSurname: true,
  secondSurname: true,
  user: { select: { id: true } },
} as const;

type UserRow = Prisma.UserGetPayload<{ select: typeof userSelect }>;
type PersonRow = Prisma.PersonGetPayload<{ select: typeof personSelect }>;

function requiredDatabaseUrl(): string {
  const value = process.env.DATABASE_URL?.trim();
  if (!value)
    throw new Error('Missing required environment variable: DATABASE_URL');
  return value;
}

function assertApplyWriteProtection(): void {
  const target = process.env.MANUAL_IDENTITY_RECONCILIATION_DATABASE;
  const protection =
    process.env.MANUAL_IDENTITY_RECONCILIATION_WRITE_PROTECTION;
  if (!['isolated', 'development', 'production'].includes(target ?? '')) {
    throw new Error(
      'MANUAL_IDENTITY_RECONCILIATION_DATABASE must be isolated, development, or production.',
    );
  }
  const expected = target === 'isolated' ? 'isolated' : 'maintenance-freeze';
  if (protection !== expected) {
    throw new Error(
      `MANUAL_IDENTITY_RECONCILIATION_WRITE_PROTECTION must be ${expected}.`,
    );
  }
}

function isTransactionWriteConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2034'
  );
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(
      'Manual legacy identity reconciliation failed.',
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  });
}
