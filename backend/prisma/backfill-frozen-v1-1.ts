import 'dotenv/config';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Client } from 'pg';

const APPLY_GATE = 'I_UNDERSTAND_THIS_APPLIES_EVIDENCE_ONLY_BACKFILLS';
const ADVISORY_LOCK = 915202611;

type CountRow = { count: string };

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function applying(): boolean {
  return process.argv.includes('--apply');
}

function assertApplyProtection(): void {
  if (process.env.FROZEN_V1_1_BACKFILL_APPLY !== APPLY_GATE) {
    throw new Error('FROZEN_V1_1_BACKFILL_APPLY gate is missing or invalid.');
  }
  if (
    process.env.FROZEN_V1_1_BACKFILL_WRITE_PROTECTION !== 'maintenance-freeze'
  ) {
    throw new Error(
      'FROZEN_V1_1_BACKFILL_WRITE_PROTECTION must be maintenance-freeze.',
    );
  }
}

async function count(client: Client, sql: string): Promise<number> {
  const result = await client.query<CountRow>(sql);
  return Number(result.rows[0]?.count ?? -1);
}

async function inventory(client: Client): Promise<Record<string, number>> {
  const queries = {
    organizationRows: `SELECT count(*)::text AS count FROM "InstitutionalProfile"`,
    organizationCanonicalComplete: `SELECT count(*)::text AS count FROM "InstitutionalProfile" WHERE "canonicalLegalName" IS NOT NULL AND "canonicalLegalIdentification" IS NOT NULL AND "canonicalDinadecoRegistrationCode" IS NOT NULL AND "canonicalOrganizationType" IS NOT NULL AND "canonicalRegion" IS NOT NULL AND "canonicalProvince" IS NOT NULL AND "canonicalCanton" IS NOT NULL AND "canonicalDistrict" IS NOT NULL AND "canonicalPhysicalAddress" IS NOT NULL AND "canonicalNotificationPhone" IS NOT NULL AND "canonicalNotificationEmail" IS NOT NULL`,
    usersWithoutPerson: `SELECT count(*)::text AS count FROM "User" WHERE "personId" IS NULL`,
    affiliatesWithoutPerson: `SELECT count(*)::text AS count FROM "Affiliate" WHERE "personId" IS NULL`,
    unresolvedManifest: `SELECT count(*)::text AS count FROM "IdentityReconciliationManifest" WHERE "selectedPersonId" IS NULL OR "reviewRequired"`,
    staleIdentityManifest: `SELECT count(*)::text AS count FROM "IdentityReconciliationManifest" manifest WHERE manifest."sourceModel" IN ('User', 'Affiliate') AND NOT EXISTS (SELECT 1 FROM "Person" person WHERE person.id = manifest."selectedPersonId")`,
    governanceTermsWithoutStatus: `SELECT count(*)::text AS count FROM "BoardTerm" WHERE "status" IS NULL`,
    governanceMembershipsWithoutTarget: `SELECT count(*)::text AS count FROM "BoardAppointment" WHERE "positionId" IS NULL OR "affiliateId" IS NULL`,
    governanceMembershipsWithoutCatalogMatch: `SELECT count(*)::text AS count FROM "BoardAppointment" membership WHERE membership."positionId" IS NULL AND NOT EXISTS (SELECT 1 FROM "GovernancePosition" position WHERE position.code = membership.position::text)`,
    assembliesWithoutScheduledAt: `SELECT count(*)::text AS count FROM "Assembly" WHERE "scheduledAt" IS NULL`,
    assembliesWithoutTargetType: `SELECT count(*)::text AS count FROM "Assembly" WHERE "assemblyType" IS NULL`,
    attendanceWithoutConvocation: `SELECT count(*)::text AS count FROM "AssemblyAttendance" WHERE "convocationId" IS NULL`,
    justificationsWithoutAttendance: `SELECT count(*)::text AS count FROM "AbsenceJustification" WHERE "attendanceId" IS NULL`,
    movementsWithoutAccount: `SELECT count(*)::text AS count FROM "FinancialMovement" WHERE "accountId" IS NULL`,
    movementsWithoutOrigin: `SELECT count(*)::text AS count FROM "FinancialMovement" WHERE "originType" IS NULL`,
    paymentsWithoutMovement: `SELECT count(*)::text AS count FROM "Payment" WHERE "movementId" IS NULL`,
    donationsWithoutOriginalMovement: `SELECT count(*)::text AS count FROM "Donation" WHERE "originalMovementId" IS NULL`,
    legacyDonationReversalsWithoutTargetLink: `SELECT count(*)::text AS count FROM "Donation" donation JOIN "FinancialMovement" reversal ON reversal.id = donation."reversalMovementId" WHERE donation."reversalMovementId" IS NOT NULL AND donation."originalMovementId" IS NOT NULL AND reversal."reversalOfId" IS NULL`,
    inventoryMovementsWithoutDelta: `SELECT count(*)::text AS count FROM "InventoryMovement" WHERE "quantityDelta" IS NULL`,
    inventoryAdjustmentsRequiringEvidence: `SELECT count(*)::text AS count FROM "InventoryMovement" WHERE "quantityDelta" IS NULL AND type IN ('ADJUSTMENT', 'OPENING_BALANCE')`,
    inventoryLoansWithoutMovementEvidence: `SELECT count(*)::text AS count FROM "InventoryLoan" WHERE "checkoutMovementId" IS NULL OR ("status" = 'RETURNED' AND "returnMovementId" IS NULL) OR ("status" = 'CANCELLED' AND "cancellationMovementId" IS NULL)`,
  } as const;
  return Object.fromEntries(
    await Promise.all(
      Object.entries(queries).map(async ([key, sql]) => [
        key,
        await count(client, sql),
      ]),
    ),
  ) as Record<string, number>;
}

function fingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function applyEvidenceOnly(client: Client) {
  const changes: Record<string, number> = {};
  const execute = async (name: string, sql: string) => {
    const result = await client.query<Record<string, never>>(sql);
    changes[name] = result.rowCount ?? 0;
  };

  // Frozen exact mapping. Never infer heldAt.
  await execute(
    'assemblyScheduledAt',
    `UPDATE "Assembly" SET "scheduledAt" = "date" WHERE "scheduledAt" IS NULL`,
  );
  await execute(
    'assemblyType',
    `UPDATE "Assembly" SET "assemblyType" = type::"AssemblyType" WHERE "assemblyType" IS NULL AND type IN ('ORDINARY', 'EXTRAORDINARY')`,
  );
  await execute(
    'convocationPositionSnapshot',
    `UPDATE "AssemblyConvocation" SET "positionNameSnapshot" = "roleNameSnapshot" WHERE "positionNameSnapshot" IS NULL AND NULLIF(btrim("roleNameSnapshot"), '') IS NOT NULL`,
  );

  // Existing unique composite keys provide exact parent correspondence.
  await execute(
    'attendanceConvocation',
    `
    UPDATE "AssemblyAttendance" attendance
    SET "convocationId" = convocation.id
    FROM "AssemblyConvocation" convocation
    WHERE attendance."convocationId" IS NULL
      AND convocation."assemblyId" = attendance."assemblyId"
      AND convocation."affiliateId" = attendance."affiliateId"`,
  );
  await execute(
    'justificationAttendance',
    `
    UPDATE "AbsenceJustification" justification
    SET "attendanceId" = attendance.id
    FROM "AssemblyAttendance" attendance
    WHERE justification."attendanceId" IS NULL
      AND attendance."assemblyId" = justification."assemblyId"
      AND attendance."affiliateId" = justification."affiliateId"`,
  );

  // Enum labels are exact shared-method labels; CHECK remains unsupported in legacy enums.
  await execute(
    'paymentFinancialMethod',
    `UPDATE "Payment" SET "financialMethod" = "method"::text::"FinancialMethod" WHERE "financialMethod" IS NULL`,
  );
  await execute(
    'donationFinancialMethod',
    `UPDATE "Donation" SET "financialMethod" = "method"::text::"FinancialMethod" WHERE "financialMethod" IS NULL`,
  );

  // Legacy sourceId is explicit current application evidence. Only unique matches link.
  await execute(
    'paymentMovement',
    `
    WITH candidate AS (
      SELECT p.id AS payment_id, min(m.id) AS movement_id
      FROM "Payment" p JOIN "FinancialMovement" m
        ON m.source = 'RESERVATION_PAYMENT' AND m."sourceId" = p.id
      WHERE p."movementId" IS NULL
      GROUP BY p.id HAVING count(*) = 1
    )
    UPDATE "Payment" p SET "movementId" = candidate.movement_id
    FROM candidate WHERE p.id = candidate.payment_id`,
  );
  await execute(
    'donationOriginalMovement',
    `
    WITH candidate AS (
      SELECT d.id AS donation_id, min(m.id) AS movement_id
      FROM "Donation" d JOIN "FinancialMovement" m
        ON m.source = 'DONATION' AND m."sourceId" = d.id
      WHERE d."originalMovementId" IS NULL
      GROUP BY d.id HAVING count(*) = 1
    )
    UPDATE "Donation" d SET "originalMovementId" = candidate.movement_id
    FROM candidate WHERE d.id = candidate.donation_id`,
  );
  await execute(
    'financialMovementOrigin',
    `
    UPDATE "FinancialMovement"
    SET "originType" = CASE source
      WHEN 'MANUAL' THEN 'MANUAL'::"FinancialMovementOriginType"
      WHEN 'RESERVATION_PAYMENT' THEN 'PAYMENT'::"FinancialMovementOriginType"
      WHEN 'DONATION' THEN 'DONATION'::"FinancialMovementOriginType"
    END
    WHERE "originType" IS NULL AND source IN ('MANUAL', 'RESERVATION_PAYMENT', 'DONATION')`,
  );
  await execute(
    'donationReversalLink',
    `
    UPDATE "FinancialMovement" reversal
    SET "reversalOfId" = donation."originalMovementId"
    FROM "Donation" donation
    WHERE donation."reversalMovementId" = reversal.id
      AND donation."originalMovementId" IS NOT NULL
      AND reversal."reversalOfId" IS NULL
      AND reversal.id <> donation."originalMovementId"
      AND NOT EXISTS (
        SELECT 1 FROM "FinancialMovement" existing
        WHERE existing."reversalOfId" = donation."originalMovementId"
          AND existing.id <> reversal.id
      )`,
  );

  // ENTRY and EXIT signs are frozen. ADJUSTMENT/OPENING_BALANCE require reviewed evidence.
  await execute(
    'inventoryEntryDelta',
    `UPDATE "InventoryMovement" SET "quantityDelta" = "quantity" WHERE "quantityDelta" IS NULL AND type = 'ENTRY'`,
  );
  await execute(
    'inventoryExitDelta',
    `UPDATE "InventoryMovement" SET "quantityDelta" = -"quantity" WHERE "quantityDelta" IS NULL AND type = 'EXIT'`,
  );

  // Governance links require a seeded catalog match or an exact Person->Affiliate link.
  // Each evidence channel is independent; neither missing value blocks the other.
  await execute(
    'governancePositionLinks',
    `
    UPDATE "BoardAppointment" membership
    SET "positionId" = position.id
    FROM "GovernancePosition" position
    WHERE membership."positionId" IS NULL
      AND position.code = membership.position::text`,
  );
  await execute(
    'governanceAffiliateLinks',
    `
    UPDATE "BoardAppointment" membership
    SET "affiliateId" = affiliate.id
    FROM "Affiliate" affiliate
    WHERE membership."affiliateId" IS NULL
      AND affiliate."personId" = membership."personId"
      AND NOT EXISTS (SELECT 1 FROM "Affiliate" duplicate WHERE duplicate."personId" = affiliate."personId" AND duplicate.id <> affiliate.id)`,
  );

  return changes;
}

async function main(): Promise<void> {
  const reportPath = resolve(
    argument('--report') ?? required('FROZEN_V1_1_BACKFILL_REPORT_PATH'),
  );
  if (applying()) assertApplyProtection();
  const client = new Client({ connectionString: required('DATABASE_URL') });
  await client.connect();
  try {
    const before = await inventory(client);
    let changes: Record<string, number> = {};
    if (applying()) {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
      try {
        await client.query(`SELECT pg_advisory_xact_lock(${ADVISORY_LOCK})`);
        changes = await applyEvidenceOnly(client);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    const after = await inventory(client);
    const report = {
      version: 'frozen-target-v1.1-backfill-1',
      mode: applying() ? 'APPLY_EVIDENCE_ONLY' : 'REPORT_ONLY',
      before,
      after,
      changes,
      beforeFingerprint: fingerprint(before),
      afterFingerprint: fingerprint(after),
      deferred: {
        organization:
          'Canonical shadows require DB-1 attestations and reconciliation executor.',
        identity:
          'Use db:reconcile-persons then db:link-person-identities; User/Affiliate NOT NULL still requires ID-01 manifest coverage.',
        governance:
          'Term status and unmatched memberships require historical evidence.',
        assemblies:
          'Unmatched attendance/justification rows remain nullable under ASM-ATT-01.',
        finance:
          'Accounts/origins and unmatched movement links require FIN-ORIGIN-01/FIN-DON-01.',
        inventory:
          'ADJUSTMENT/opening balances and loan movement links require INV-LEDGER-01/INV-LOAN-01.',
      },
    };
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(
      `Frozen V1.1 backfill ${report.mode} complete; report written.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    'Frozen V1.1 backfill failed:',
    error instanceof Error ? error.message : 'unknown error',
  );
  process.exitCode = 1;
});
