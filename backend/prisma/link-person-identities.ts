import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../generated/prisma/client';
import {
  buildIdentityLinkPlan,
  identityLinkManifestVersions,
  type IdentityLinkManifestDecision,
  type IdentityLinkSource,
  type IdentityLinkPreflight,
} from '../src/identity-reconciliation/identity-link-migration';

const ADVISORY_LOCK_ID = 915202605;

interface LinkSummary {
  preflight: IdentityLinkPreflight;
  userLinksCreated: number;
  affiliateLinksCreated: number;
  personRowsBefore: number;
  personRowsAfter: number;
  userRequestPersonLinksPopulated: number;
  affiliateRequestPersonLinksPopulated: number;
  blocked: boolean;
}

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function requiredReportPath(): string {
  const args = process.argv.slice(2);
  const optionIndex = args.indexOf('--report');
  const fromArgument = optionIndex >= 0 ? args[optionIndex + 1] : undefined;
  const path = fromArgument ?? process.env.IDENTITY_LINK_MIGRATION_REPORT_PATH;
  if (!path) {
    throw new Error(
      'Provide --report <path> or IDENTITY_LINK_MIGRATION_REPORT_PATH for the link migration report.',
    );
  }
  return resolve(path);
}

function assertWriteProtection(): void {
  const target = process.env.IDENTITY_LINK_MIGRATION_DATABASE;
  const protection = process.env.IDENTITY_LINK_MIGRATION_WRITE_PROTECTION;
  if (target !== 'isolated' && target !== 'development') {
    throw new Error(
      'IDENTITY_LINK_MIGRATION_DATABASE must be isolated or development.',
    );
  }
  if (protection !== 'isolated' && protection !== 'maintenance-freeze') {
    throw new Error(
      'IDENTITY_LINK_MIGRATION_WRITE_PROTECTION must be isolated or maintenance-freeze.',
    );
  }
}

async function main(): Promise<void> {
  assertWriteProtection();
  const reportPath = requiredReportPath();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: requiredEnvironmentVariable('DATABASE_URL'),
    }),
  });

  try {
    const summary = await linkWithRetry(prisma);
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(
      reportPath,
      `${JSON.stringify(
        {
          ...identityLinkManifestVersions,
          summary,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
    if (summary.blocked) {
      console.error('Identity link migration blocked by preflight findings.');
      process.exitCode = 1;
      return;
    }
    console.log(
      `Identity links complete: ${summary.userLinksCreated} User links; ${summary.affiliateLinksCreated} Affiliate links.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function linkWithRetry(prisma: PrismaClient): Promise<LinkSummary> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => link(tx), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (!isTransactionWriteConflict(error) || attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }
  throw new Error('Identity link migration retry budget exhausted.');
}

async function link(tx: Prisma.TransactionClient): Promise<LinkSummary> {
  await tx.$executeRawUnsafe(
    `SELECT pg_advisory_xact_lock(${ADVISORY_LOCK_ID})`,
  );
  const [
    users,
    affiliates,
    manifests,
    people,
    personRowsBefore,
    userRequestPersonLinksAtStart,
    affiliateRequestPersonLinksAtStart,
  ] = await Promise.all([
    tx.user.findMany({
      select: {
        id: true,
        personId: true,
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
        personId: true,
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
    tx.identityReconciliationManifest.findMany({
      where: {
        manifestVersion: identityLinkManifestVersions.manifestVersion,
        normalizationVersion: identityLinkManifestVersions.normalizationVersion,
        decisionVersion: identityLinkManifestVersions.decisionVersion,
        sourceModel: { in: ['User', 'Affiliate'] },
      },
      select: {
        manifestVersion: true,
        sourceModel: true,
        sourceId: true,
        sourceFingerprint: true,
        identityClusterKey: true,
        classification: true,
        selectedPersonId: true,
        personCreationAllowed: true,
        reviewRequired: true,
      },
    }),
    tx.person.findMany({ select: { id: true } }),
    tx.person.count(),
    tx.userRequest.count({ where: { personId: { not: null } } }),
    tx.affiliateRequest.count({ where: { personId: { not: null } } }),
  ]);

  const sources: IdentityLinkSource[] = [
    ...users.map(({ id, ...user }) => ({
      ...user,
      sourceModel: 'User' as const,
      sourceId: id,
      birthDate: null,
    })),
    ...affiliates.map(({ id, ...affiliate }) => ({
      ...affiliate,
      sourceModel: 'Affiliate' as const,
      sourceId: id,
    })),
  ];
  const plan = buildIdentityLinkPlan(
    sources,
    manifests as IdentityLinkManifestDecision[],
    new Set(people.map((person) => person.id)),
  );
  if (plan.blocked) {
    return blockedSummary(
      plan.preflight,
      personRowsBefore,
      userRequestPersonLinksAtStart,
      affiliateRequestPersonLinksAtStart,
    );
  }

  let userLinksCreated = 0;
  let affiliateLinksCreated = 0;
  for (const assignment of plan.assignments) {
    const result =
      assignment.sourceModel === 'User'
        ? await tx.user.updateMany({
            where: { id: assignment.sourceId, personId: null },
            data: { personId: assignment.personId },
          })
        : await tx.affiliate.updateMany({
            where: { id: assignment.sourceId, personId: null },
            data: { personId: assignment.personId },
          });
    if (result.count !== 1) {
      throw new Error(
        `Source ${assignment.sourceModel}:${assignment.sourceId} changed during link migration.`,
      );
    }
    if (assignment.sourceModel === 'User') userLinksCreated += 1;
    else affiliateLinksCreated += 1;
  }

  const [
    personRowsAfter,
    userRequestPersonLinksPopulated,
    affiliateRequestPersonLinksPopulated,
  ] = await Promise.all([
    tx.person.count(),
    tx.userRequest.count({ where: { personId: { not: null } } }),
    tx.affiliateRequest.count({ where: { personId: { not: null } } }),
  ]);
  if (personRowsAfter !== personRowsBefore) {
    throw new Error('IDENTITY-6 must not create or mutate Person rows.');
  }
  return {
    preflight: plan.preflight,
    userLinksCreated,
    affiliateLinksCreated,
    personRowsBefore,
    personRowsAfter,
    userRequestPersonLinksPopulated,
    affiliateRequestPersonLinksPopulated,
    blocked: false,
  };
}

function blockedSummary(
  preflight: IdentityLinkPreflight,
  personRows: number,
  userRequestPersonLinksPopulated: number,
  affiliateRequestPersonLinksPopulated: number,
): LinkSummary {
  return {
    preflight,
    userLinksCreated: 0,
    affiliateLinksCreated: 0,
    personRowsBefore: personRows,
    personRowsAfter: personRows,
    userRequestPersonLinksPopulated,
    affiliateRequestPersonLinksPopulated,
    blocked: true,
  };
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
  console.error('Identity link migration failed.', error);
  process.exitCode = 1;
});
