/*
 * DESTRUCTIVE, disposable acceptance harness. Implementation only; do not run
 * unless both URLs target exactly localhost:5432/sgi_org_profile_reconciliation_test.
 * Required opt-in:
 * FROZEN_V1_1_ACCEPTANCE_ALLOW_DESTRUCTIVE=I_UNDERSTAND_THIS_DROPS_PUBLIC_SCHEMA
 */
import { createHash } from 'node:crypto';
import {
  cp,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { Client } from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, '../..');
const prismaRoot = path.join(backendRoot, 'prisma');
const sourceMigrations = path.join(prismaRoot, 'migrations');
const baselineLast =
  '20260923120000_add_institutional_profile_canonical_shadows';
const targetMigrations = [
  '20260927100000_frozen_target_v1_1_expand',
  '20260927110000_frozen_target_v1_1_safe_checks',
];
const databaseName = 'sgi_org_profile_reconciliation_test';
const gateValue = 'I_UNDERSTAND_THIS_DROPS_PUBLIC_SCHEMA';
let currentStage = 'configuration';

function safeDiagnostic(value) {
  return String(value ?? '')
    .replace(/postgres(?:ql)?:\/\/\S+/gi, '[REDACTED_DATABASE_URL]')
    .replace(/(password\s*[=:]\s*)\S+/gi, '$1[REDACTED]')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, 800);
}

function fail(code) {
  throw new Error(`frozen-v1.1 acceptance failed: ${code}`);
}
function assert(condition, code) {
  if (!condition) fail(code);
}

function parseProtectedUrl(name) {
  const value = process.env[name];
  assert(
    typeof value === 'string' && value.length > 0,
    `missing-${name.toLowerCase()}`,
  );
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(`malformed-${name.toLowerCase()}`);
  }
  assert(
    url.protocol === 'postgres:' || url.protocol === 'postgresql:',
    `${name.toLowerCase()}-protocol`,
  );
  assert(url.hostname === 'localhost', `${name.toLowerCase()}-host`);
  assert(url.port === '5432', `${name.toLowerCase()}-port`);
  assert(
    decodeURIComponent(url.pathname).replace(/^\//, '') === databaseName,
    `${name.toLowerCase()}-database`,
  );
  assert(
    !url.searchParams.has('schema') ||
      url.searchParams.get('schema') === 'public',
    `${name.toLowerCase()}-schema`,
  );
  return {
    value,
    target: `${url.hostname}:${url.port}/${databaseName}`,
    username: decodeURIComponent(url.username),
  };
}

function validateDestructiveConfiguration() {
  assert(
    process.env.FROZEN_V1_1_ACCEPTANCE_ALLOW_DESTRUCTIVE === gateValue,
    'destructive-gate',
  );
  const database = parseProtectedUrl('DATABASE_URL');
  const direct = parseProtectedUrl('DIRECT_URL');
  assert(
    database.target === direct.target && database.username === direct.username,
    'datasource-target-mismatch',
  );
  return database.value;
}

async function migrationNamesThrough(last) {
  const entries = await readdir(sourceMigrations, { withFileTypes: true });
  const names = entries
    .filter((entry) => entry.isDirectory() && /^\d{14}_/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  const index = names.indexOf(last);
  assert(index >= 0, 'baseline-migration-missing');
  return names.slice(0, index + 1);
}

async function prepareSandbox(root) {
  const migrations = path.join(root, 'migrations');
  await cp(
    path.join(prismaRoot, 'schema.prisma'),
    path.join(root, 'schema.prisma'),
  );
  for (const name of await migrationNamesThrough(baselineLast)) {
    await cp(path.join(sourceMigrations, name), path.join(migrations, name), {
      recursive: true,
    });
  }
  await writeFile(
    path.join(root, 'prisma.config.ts'),
    `import { defineConfig } from 'prisma/config';\nexport default defineConfig({ schema: './schema.prisma', migrations: { path: './migrations' }, datasource: { url: process.env.DATABASE_URL } });\n`,
  );
  return migrations;
}

function migrate(root, url) {
  const cli = path.join(
    backendRoot,
    'node_modules',
    'prisma',
    'build',
    'index.js',
  );
  const result = spawnSync(
    process.execPath,
    [cli, 'migrate', 'deploy', '--config', path.join(root, 'prisma.config.ts')],
    {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
    },
  );
  if (result.error !== undefined || result.status !== 0) {
    fail(
      `migrate-deploy; child-status=${result.status ?? 'none'}; child-signal=${result.signal ?? 'none'}; stderr=${safeDiagnostic(result.stderr) || 'empty'}`,
    );
  }
}

async function resetPublic(client) {
  await client.query('DROP SCHEMA IF EXISTS public CASCADE');
  await client.query('CREATE SCHEMA public');
  await client.query('GRANT ALL ON SCHEMA public TO CURRENT_USER');
}

async function seedBrownfield(client) {
  await client.query(`UPDATE "InstitutionalProfile" SET
    "legalName"='Synthetic ADI', "legalIdentification"='SYN-001', "dinadecoRegistrationCode"='DINADECO-SYN',
    "dinadecoRegion"='Synthetic Region', "organizationType"='INTEGRAL', province='Guanacaste', canton='Nicoya',
    district='Curime', locality='Synthetic locality', "correspondenceAddress"='Synthetic address', phone='22220000',
    telefax='22220001', email='org@example.invalid', "canonicalLegalName"='Synthetic ADI',
    "canonicalLegalIdentification"='SYN-001', "canonicalDinadecoRegistrationCode"='DINADECO-SYN',
    "canonicalOrganizationType"='Asociación de Desarrollo Integral', "canonicalRegion"='Synthetic Region',
    "canonicalProvince"='Guanacaste', "canonicalCanton"='Nicoya', "canonicalDistrict"='Curime',
    "canonicalPhysicalAddress"='Synthetic address', "canonicalNotificationPhone"='22220000',
    "canonicalNotificationFax"='22220001', "canonicalNotificationEmail"='org@example.invalid' WHERE id=1`);
  const role = (
    await client.query(
      `INSERT INTO "Role" (name, "updatedAt") VALUES ('SYN_ADMIN', now()) RETURNING id`,
    )
  ).rows[0];
  const person = (
    await client.query(
      `INSERT INTO "Person" ("firstName", "firstSurname", "legacyFullName", identification, "identificationType", "normalizedIdentification", email, "updatedAt") VALUES ('Synthetic','Person','Synthetic Person','100000001','NATIONAL','100000001','person@example.invalid',now()) RETURNING id`,
    )
  ).rows[0];
  const unmatchedPerson = (
    await client.query(
      `INSERT INTO "Person" ("firstName", "firstSurname", "legacyFullName", identification, "identificationType", "normalizedIdentification", "updatedAt") VALUES ('Unmatched','Governor','Unmatched Governor','100000099','NATIONAL','100000099',now()) RETURNING id`,
    )
  ).rows[0];
  const user = (
    await client.query(
      `INSERT INTO "User" ("fullName", identification, email, "passwordHash", "roleId", "personId", "updatedAt") VALUES ('Synthetic Person','100000001','user@example.invalid','synthetic-not-a-real-secret',$1,$2,now()) RETURNING id`,
      [role.id, person.id],
    )
  ).rows[0];
  await client.query(
    `INSERT INTO "Session" ("refreshTokenHash","expiresAt","userId") VALUES ('synthetic-refresh-hash',now()+interval '1 day',$1)`,
    [user.id],
  );
  await client.query(
    `INSERT INTO "PasswordResetToken" ("tokenHash","expiresAt","userId") VALUES ('synthetic-reset-hash',now()+interval '1 day',$1)`,
    [user.id],
  );
  await client.query(
    `INSERT INTO "AccountActivationToken" ("tokenHash","expiresAt","userId") VALUES ('synthetic-activation-hash',now()+interval '1 day',$1)`,
    [user.id],
  );
  await client.query(
    `INSERT INTO "UserRequest" ("fullName",identification,email,reason,status,"reviewedById","personId","updatedAt") VALUES ('Synthetic Person','100000001','request@example.invalid','Synthetic request','APPROVED',$1,$2,now())`,
    [user.id, person.id],
  );
  await client.query(
    `INSERT INTO "IdentityReconciliationManifest" ("manifestVersion","normalizationVersion","decisionVersion","sourceModel","sourceId","sourceFingerprint","identificationType","normalizedIdentification","identityClusterKey",classification,"selectedPersonId","personCreationAllowed","conflictCodes","nameReconciliationRequired","reviewRequired","sourceSnapshot","updatedAt") VALUES ('synthetic-v1','synthetic-norm','synthetic-decision','User',$1,'synthetic-fingerprint','NATIONAL','100000001','NATIONAL:100000001','IDENTITY_MATCH',$2,true,'[]',false,false,'{}',now())`,
    [user.id, person.id],
  );
  const affiliate = (
    await client.query(
      `INSERT INTO "Affiliate" ("fullName",identification,"birthDate",address,"personId","roleId","updatedAt") VALUES ('Synthetic Person','100000001','1990-01-01','Synthetic address',$1,$2,now()) RETURNING id`,
      [person.id, role.id],
    )
  ).rows[0];
  await client.query(
    `INSERT INTO "AffiliateRequest" ("fullName",identification,"birthDate",address,"affiliationReason",status,"reviewedById","personId","updatedAt") VALUES ('Synthetic Person','100000002','1990-01-01','Synthetic address','Synthetic affiliation','APPROVED',$1,$2,now())`,
    [user.id, person.id],
  );
  await client.query(
    `INSERT INTO "AffiliateSanction" (reason,status,"affiliateId","createdById","updatedAt") VALUES ('Synthetic sanction','RESOLVED',$1,$2,now())`,
    [affiliate.id, user.id],
  );
  const term = (
    await client.query(
      `INSERT INTO "BoardTerm" ("institutionalProfileId","startsOn","endsOn","updatedAt") VALUES (1,'2026-01-01','2027-01-01',now()) RETURNING id`,
    )
  ).rows[0];
  const unmatchedGovernanceMembership = (
    await client.query(
      `INSERT INTO "BoardAppointment" ("boardTermId","personId",position,"seatNumber","startsOn","updatedAt") VALUES ($1,$2,'FISCAL',1,'2026-01-01',now()) RETURNING id`,
      [term.id, unmatchedPerson.id],
    )
  ).rows[0];
  await client.query(
    `INSERT INTO "BoardAppointment" ("boardTermId","personId",position,"seatNumber","startsOn","updatedAt") VALUES ($1,$2,'PRESIDENT',1,'2026-01-01',now())`,
    [term.id, person.id],
  );
  const assembly = (
    await client.query(
      `INSERT INTO "Assembly" (title,type,date,place,status,"updatedAt") VALUES ('Synthetic assembly','ORDINARY',now(),'Synthetic hall','COMPLETED',now()) RETURNING id`,
    )
  ).rows[0];
  const convocation = (
    await client.query(
      `INSERT INTO "AssemblyConvocation" ("assemblyId","affiliateId","roleId","roleNameSnapshot","updatedAt") VALUES ($1,$2,$3,'PRESIDENT',now()) RETURNING id`,
      [assembly.id, affiliate.id, role.id],
    )
  ).rows[0];
  const attendance = (
    await client.query(
      `INSERT INTO "AssemblyAttendance" (status,"assemblyId","affiliateId","updatedAt") VALUES ('ABSENT',$1,$2,now()) RETURNING id`,
      [assembly.id, affiliate.id],
    )
  ).rows[0];
  await client.query(
    `INSERT INTO "AbsenceJustification" (reason,status,"assemblyId","affiliateId","updatedAt") VALUES ('Synthetic evidence','APPROVED',$1,$2,now())`,
    [assembly.id, affiliate.id],
  );
  const unresolvedAssembly = (
    await client.query(
      `INSERT INTO "Assembly" (title,type,date,place,status,"updatedAt") VALUES ('Synthetic unresolved assembly','EXTRAORDINARY',now(),'Synthetic hall','COMPLETED',now()) RETURNING id`,
    )
  ).rows[0];
  const unresolvedAttendance = (
    await client.query(
      `INSERT INTO "AssemblyAttendance" (status,"assemblyId","affiliateId","updatedAt") VALUES ('JUSTIFIED',$1,$2,now()) RETURNING id`,
      [unresolvedAssembly.id, affiliate.id],
    )
  ).rows[0];
  // Baseline composite FK forbids a justification without attendance.
  // Nearest legal unresolved case: attendance/justification pair without a convocation.
  const unresolvedJustification = (
    await client.query(
      `INSERT INTO "AbsenceJustification" (reason,status,"assemblyId","affiliateId","updatedAt") VALUES ('Synthetic unresolved convocation evidence','PENDING',$1,$2,now()) RETURNING id`,
      [unresolvedAssembly.id, affiliate.id],
    )
  ).rows[0];
  const event = (
    await client.query(
      `INSERT INTO "Event" ("publicId",title,summary,"startAt","updatedAt") VALUES ('synthetic-event','Synthetic event','Synthetic summary',now(),now()) RETURNING id`,
    )
  ).rows[0];
  const resource = (
    await client.query(
      `INSERT INTO "ReservableResource" (name,"pricingType",price,"updatedAt") VALUES ('Synthetic room','FIXED',1000,now()) RETURNING id`,
    )
  ).rows[0];
  const reservation = (
    await client.query(
      `INSERT INTO "Reservation" ("startAt","endAt",purpose,status,"resourceId","requesterUserId","approvedById","eventId","updatedAt") VALUES (now()+interval '1 day',now()+interval '2 hours 1 day','Synthetic reservation','APPROVED',$1,$2,$2,$3,now()) RETURNING id`,
      [resource.id, user.id, event.id],
    )
  ).rows[0];
  const charge = (
    await client.query(
      `INSERT INTO "FinancialCharge" ("reservationId",amount,status,"updatedAt") VALUES ($1,1000,'PAID',now()) RETURNING id`,
      [reservation.id],
    )
  ).rows[0];
  const payment = (
    await client.query(
      `INSERT INTO "Payment" ("chargeId",amount,status,method,"paidAt","recordedById","updatedAt") VALUES ($1,1000,'CONFIRMED','CASH',now(),$2,now()) RETURNING id`,
      [charge.id, user.id],
    )
  ).rows[0];
  const movement = (
    await client.query(
      `INSERT INTO "FinancialMovement" (type,source,amount,description,"occurredAt","sourceId","recordedById","updatedAt") VALUES ('INCOME','RESERVATION_PAYMENT',1000,'Synthetic payment',now(),$1,$2,now()) RETURNING id`,
      [payment.id, user.id],
    )
  ).rows[0];
  const ambiguousPayment = (
    await client.query(
      `INSERT INTO "Payment" ("chargeId",amount,status,method,"paidAt","recordedById","updatedAt") VALUES ($1,1000,'CONFIRMED','CASH',now(),$2,now()) RETURNING id`,
      [charge.id, user.id],
    )
  ).rows[0];
  const ambiguousPaymentMovementA = (
    await client.query(
      `INSERT INTO "FinancialMovement" (type,source,amount,description,"occurredAt","sourceId","recordedById","updatedAt") VALUES ('INCOME','RESERVATION_PAYMENT',1000,'Synthetic ambiguous payment A',now(),$1,$2,now()) RETURNING id`,
      [ambiguousPayment.id, user.id],
    )
  ).rows[0];
  const ambiguousPaymentMovementB = (
    await client.query(
      `INSERT INTO "FinancialMovement" (type,source,amount,description,"occurredAt","sourceId","recordedById","updatedAt") VALUES ('INCOME','RESERVATION_PAYMENT',1000,'Synthetic ambiguous payment B',now(),$1,$2,now()) RETURNING id`,
      [ambiguousPayment.id, user.id],
    )
  ).rows[0];
  const donation = (
    await client.query(
      `INSERT INTO "Donation" ("donorName","donorIdentification",amount,method,description,"receivedAt","recordedById","updatedAt") VALUES ('Synthetic donor','100000001',500,'CASH','Synthetic donation',now(),$1,now()) RETURNING id`,
      [user.id],
    )
  ).rows[0];
  const donationMovement = (
    await client.query(
      `INSERT INTO "FinancialMovement" (type,source,amount,description,"occurredAt","sourceId","recordedById","updatedAt") VALUES ('INCOME','DONATION',500,'Synthetic donation',now(),$1,$2,now()) RETURNING id`,
      [donation.id, user.id],
    )
  ).rows[0];
  await client.query(
    `UPDATE "Donation" SET "originalMovementId"=$1 WHERE id=$2`,
    [donationMovement.id, donation.id],
  );
  const donationReversalMovement = (
    await client.query(
      `INSERT INTO "FinancialMovement" (type,source,amount,description,"occurredAt","sourceId","recordedById","updatedAt") VALUES ('EXPENSE','DONATION',500,'Synthetic donation reversal',now(),$1,$2,now()) RETURNING id`,
      [donation.id, user.id],
    )
  ).rows[0];
  await client.query(
    `UPDATE "Donation" SET "reversalMovementId"=$1 WHERE id=$2`,
    [donationReversalMovement.id, donation.id],
  );
  await client.query(
    `INSERT INTO "AuditLog" (action,module,"entityType","entityId","userId") VALUES ('SYNTHETIC_CREATED','ACCEPTANCE','Donation',$1::text,$2)`,
    [donation.id, user.id],
  );
  const category = (
    await client.query(
      `INSERT INTO "InventoryCategory" (name,"updatedAt") VALUES ('Synthetic category',now()) RETURNING id`,
    )
  ).rows[0];
  const item = (
    await client.query(
      `INSERT INTO "InventoryItem" (code,name,"currentQuantity","minimumQuantity","categoryId","updatedAt") VALUES ('SYN-ITEM','Synthetic item',5,1,$1,now()) RETURNING id`,
      [category.id],
    )
  ).rows[0];
  await client.query(
    `INSERT INTO "InventoryMovement" (type,quantity,reason,"itemId","createdById") VALUES ('ENTRY',5,'Synthetic entry',$1,$2)`,
    [item.id, user.id],
  );
  const uncertainAdjustment = (
    await client.query(
      `INSERT INTO "InventoryMovement" (type,quantity,reason,"itemId","createdById") VALUES ('ADJUSTMENT',2,'Synthetic uncertain adjustment',$1,$2) RETURNING id`,
      [item.id, user.id],
    )
  ).rows[0];
  const uncertainLoan = (
    await client.query(
      `INSERT INTO "InventoryLoan" (quantity,"borrowerName","expectedReturnDate","itemId","borrowerAffiliateId","createdById","updatedAt") VALUES (1,'Synthetic Person',now()+interval '7 days',$1,$2,$3,now()) RETURNING id`,
      [item.id, affiliate.id, user.id],
    )
  ).rows[0];
  return {
    role,
    person,
    unmatchedPerson,
    user,
    affiliate,
    term,
    assembly,
    convocation,
    attendance,
    unresolvedAttendance,
    unresolvedJustification,
    unmatchedGovernanceMembership,
    resource,
    reservation,
    charge,
    payment,
    movement,
    ambiguousPayment,
    ambiguousPaymentMovementA,
    ambiguousPaymentMovementB,
    donation,
    donationMovement,
    donationReversalMovement,
    item,
    uncertainAdjustment,
    uncertainLoan,
  };
}

const preservedQueries = {
  organization: `SELECT id,"legalName","legalIdentification","dinadecoRegistrationCode","dinadecoRegion","organizationType",province,canton,district,locality,"correspondenceAddress",phone,telefax,email,"canonicalLegalName","canonicalLegalIdentification","canonicalDinadecoRegistrationCode","canonicalOrganizationType","canonicalRegion","canonicalProvince","canonicalCanton","canonicalDistrict","canonicalPhysicalAddress","canonicalNotificationPhone","canonicalNotificationFax","canonicalNotificationEmail" FROM "InstitutionalProfile" ORDER BY id`,
  identity: `SELECT id,"firstName","firstSurname","legacyFullName",identification,"identificationType","normalizedIdentification" FROM "Person" ORDER BY id`,
  user: `SELECT id,"fullName",identification,email,"roleId","personId",status FROM "User" ORDER BY id`,
  affiliate: `SELECT id,"fullName",identification,"personId","roleId",status FROM "Affiliate" ORDER BY id`,
  boardTerms: `SELECT id,"institutionalProfileId","startsOn","endsOn" FROM "BoardTerm" ORDER BY id`,
  boardAppointments: `SELECT id,"boardTermId","personId",position,"seatNumber","startsOn","endsOn" FROM "BoardAppointment" ORDER BY id`,
  assemblies: `SELECT id,title,type,date,place,status FROM "Assembly" ORDER BY id`,
  convocations: `SELECT id,"assemblyId","affiliateId","roleId","roleNameSnapshot" FROM "AssemblyConvocation" ORDER BY id`,
  attendances: `SELECT id,status,"assemblyId","affiliateId" FROM "AssemblyAttendance" ORDER BY id`,
  absenceJustifications: `SELECT id,reason,status,"rejectionReason","reviewedAt","assemblyId","affiliateId","reviewedById","decisionNote","attachmentOriginalName","attachmentMimeType","attachmentSize","attachmentUrl" FROM "AbsenceJustification" ORDER BY id`,
  events: `SELECT id,"publicId",title,summary,description,"startAt","endAt",location,status,"publicationStatus" FROM "Event" ORDER BY id`,
  reservableResources: `SELECT id,name,description,location,capacity,status,price,"pricingType" FROM "ReservableResource" ORDER BY id`,
  reservations: `SELECT id,"resourceId","requesterUserId","approvedById","eventId",status,"startAt","endAt" FROM "Reservation" ORDER BY id`,
  financialCharges: `SELECT id,"reservationId",amount,currency,status,"dueAt" FROM "FinancialCharge" ORDER BY id`,
  payments: `SELECT id,"chargeId",amount,status,method,reference,"paidAt","recordedById" FROM "Payment" ORDER BY id`,
  finance: `SELECT id,type,source,amount,currency,"sourceId","recordedById" FROM "FinancialMovement" ORDER BY id`,
  donations: `SELECT id,"donorName","donorIdentification",amount,method,status,"originalMovementId","reversalMovementId" FROM "Donation" ORDER BY id`,
  inventoryItems: `SELECT id,code,"currentQuantity","minimumQuantity","categoryId" FROM "InventoryItem" ORDER BY id`,
  inventoryMovements: `SELECT id,type,quantity,"itemId","createdById" FROM "InventoryMovement" ORDER BY id`,
  audit: `SELECT id,action,module,"entityType","entityId","userId" FROM "AuditLog" ORDER BY id`,
  requests: `SELECT id,"fullName",identification,email,status,"reviewedById","personId" FROM "UserRequest" ORDER BY id`,
  affiliateRequests: `SELECT id,"fullName",identification,status,"reviewedById","personId" FROM "AffiliateRequest" ORDER BY id`,
  sanctions: `SELECT id,reason,status,"affiliateId","createdById" FROM "AffiliateSanction" ORDER BY id`,
  sessions: `SELECT id,"refreshTokenHash","expiresAt","revokedAt","userId" FROM "Session" ORDER BY id`,
  resetTokens: `SELECT id,"tokenHash","expiresAt","usedAt","userId" FROM "PasswordResetToken" ORDER BY id`,
  activationTokens: `SELECT id,"tokenHash","expiresAt","usedAt","userId" FROM "AccountActivationToken" ORDER BY id`,
  loans: `SELECT id,quantity,"borrowerName","loanDate","expectedReturnDate","returnedAt",status,"itemId","borrowerAffiliateId","createdById","receivedById" FROM "InventoryLoan" ORDER BY id`,
};

async function snapshot(client) {
  const result = {};
  for (const [name, query] of Object.entries(preservedQueries))
    result[name] = (await client.query(query)).rows;
  return result;
}
function fingerprint(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
function groupFingerprints(value) {
  return Object.fromEntries(
    Object.entries(value).map(([name, rows]) => [name, fingerprint(rows)]),
  );
}

async function prepareSyntheticEvidence(client, ids) {
  const position = (
    await client.query(
      `INSERT INTO "GovernancePosition" (code,name,"updatedAt") VALUES ('PRESIDENT','President',now()) RETURNING id`,
    )
  ).rows[0];
  const account = (
    await client.query(
      `INSERT INTO "FinancialAccount" (code,name,"updatedAt") VALUES ('SYN-CASH','Synthetic cash',now()) RETURNING id`,
    )
  ).rows[0];
  ids.position = position;
  ids.account = account;
}

function runBackfill(url, reportPath) {
  const cli = path.join(backendRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const result = spawnSync(
    process.execPath,
    [
      cli,
      path.join(prismaRoot, 'backfill-frozen-v1-1.ts'),
      '--apply',
      '--report',
      reportPath,
    ],
    {
      cwd: backendRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        DATABASE_URL: url,
        FROZEN_V1_1_BACKFILL_APPLY:
          'I_UNDERSTAND_THIS_APPLIES_EVIDENCE_ONLY_BACKFILLS',
        FROZEN_V1_1_BACKFILL_WRITE_PROTECTION: 'maintenance-freeze',
      },
    },
  );
  if (result.error !== undefined || result.status !== 0) {
    fail(
      `evidence-backfill; child-status=${result.status ?? 'none'}; child-signal=${result.signal ?? 'none'}; stderr=${safeDiagnostic(result.stderr) || 'empty'}`,
    );
  }
}

async function applySyntheticAttestations(client, ids) {
  await client.query(`UPDATE "BoardTerm" SET status='ACTIVE' WHERE id=$1`, [
    ids.term.id,
  ]);
  await client.query(
    `UPDATE "FinancialMovement" SET "accountId"=$1,status='POSTED' WHERE "accountId" IS NULL OR status IS NULL`,
    [ids.account.id],
  );
  await client.query(`UPDATE "Donation" SET "donorPersonId"=$1 WHERE id=$2`, [
    ids.person.id,
    ids.donation.id,
  ]);
}

async function seedTargetOnly(client, ids) {
  const permission = (
    await client.query(
      `INSERT INTO "Permission" (code,name,"updatedAt") VALUES ('synthetic.accept','Synthetic accept',now()) RETURNING id`,
    )
  ).rows[0];
  await client.query(
    `INSERT INTO "RolePermission" ("roleId","permissionId") VALUES ($1,$2)`,
    [ids.role.id, permission.id],
  );
  await client.query(
    `INSERT INTO "AssemblyCall" ("assemblyId","callNumber","scheduledAt","quorumType","quorumValue","updatedAt") VALUES ($1,1,now(),'FIXED',1,now())`,
    [ids.assembly.id],
  );
  await client.query(
    `INSERT INTO "AssemblyMinute" ("assemblyId",content,"updatedAt") VALUES ($1,'Synthetic minute',now())`,
    [ids.assembly.id],
  );
  const resolution = (
    await client.query(
      `INSERT INTO "AssemblyResolution" ("assemblyId",title,content,"resolvedAt","updatedAt") VALUES ($1,'Synthetic resolution','Synthetic content',now(),now()) RETURNING id`,
      [ids.assembly.id],
    )
  ).rows[0];
  const expense = (
    await client.query(
      `INSERT INTO "Expense" (description,amount,"incurredAt",status,"authorizationResolutionId","updatedAt") VALUES ('Synthetic expense',200,now(),'APPROVED',$1,now()) RETURNING id`,
      [resolution.id],
    )
  ).rows[0];
  await client.query(
    `INSERT INTO "ExpenseDocument" ("expenseId","originalName","mimeType",size,url) VALUES ($1,'synthetic.pdf','application/pdf',10,'https://example.invalid/synthetic.pdf')`,
    [expense.id],
  );
  const expenseMovement = (
    await client.query(
      `INSERT INTO "FinancialMovement" (type,source,amount,description,"occurredAt","recordedById","accountId","originType",status,"updatedAt") VALUES ('EXPENSE','MANUAL',200,'Synthetic disbursement',now(),$1,$2,'DISBURSEMENT','POSTED',now()) RETURNING id`,
      [ids.user.id, ids.account.id],
    )
  ).rows[0];
  await client.query(
    `INSERT INTO "Disbursement" ("expenseId","movementId",amount,method,"paidAt","updatedAt") VALUES ($1,$2,200,'CASH',now(),now())`,
    [expense.id, expenseMovement.id],
  );
  await client.query(
    `INSERT INTO "FundingAllocation" ("expenseId","sourceType",amount,"incomeMovementId","updatedAt") VALUES ($1,'OWN_FUNDS',200,$2,now())`,
    [expense.id, ids.movement.id],
  );
  const opportunity = (
    await client.query(
      `INSERT INTO "VolunteerOpportunity" (title,status,"createdByUserId","publishedAt","updatedAt") VALUES ('Synthetic opportunity','PUBLISHED',$1,now(),now()) RETURNING id`,
      [ids.user.id],
    )
  ).rows[0];
  const session = (
    await client.query(
      `INSERT INTO "VolunteerSession" ("opportunityId","startAt","endAt","updatedAt") VALUES ($1,now(),now()+interval '2 hours',now()) RETURNING id`,
      [opportunity.id],
    )
  ).rows[0];
  const application = (
    await client.query(
      `INSERT INTO "VolunteerApplication" ("opportunityId","personId","submittedFullName","submittedIdentificationType","submittedIdentification","submittedNormalizedIdentification",status,"reviewedByUserId","reviewedAt","updatedAt") VALUES ($1,$2,'Synthetic Person','NATIONAL','100000001','100000001','APPROVED',$3,now(),now()) RETURNING id`,
      [opportunity.id, ids.person.id, ids.user.id],
    )
  ).rows[0];
  const participation = (
    await client.query(
      `INSERT INTO "VolunteerParticipation" ("opportunityId","personId","applicationId","updatedAt") VALUES ($1,$2,$3,now()) RETURNING id`,
      [opportunity.id, ids.person.id, application.id],
    )
  ).rows[0];
  await client.query(
    `INSERT INTO "VolunteerAttendance" ("participationId","sessionId",status,"creditedHours","recordedByUserId","updatedAt") VALUES ($1,$2,'PRESENT',2,$3,now())`,
    [participation.id, session.id, ids.user.id],
  );
  const venture = (
    await client.query(
      `INSERT INTO "Venture" (name,status,"publicationStatus","incorporatedAt","updatedAt") VALUES ('Synthetic venture','ACTIVE','PUBLISHED',now(),now()) RETURNING id`,
    )
  ).rows[0];
  await client.query(
    `INSERT INTO "VentureAssociation" ("personId","ventureId","startedAt","updatedAt") VALUES ($1,$2,now(),now())`,
    [ids.person.id, venture.id],
  );
  const request = (
    await client.query(
      `INSERT INTO "VentureRequest" (purpose,status,"reconciledPersonId","ventureId","resolvedAt","updatedAt") VALUES ('UPDATE','APPROVED',$1,$2,now(),now()) RETURNING id`,
      [ids.person.id, venture.id],
    )
  ).rows[0];
  await client.query(
    `INSERT INTO "VentureRequestRevision" ("requestId","revisionNumber","payloadVersion","submittedData") VALUES ($1,1,1,'{"name":"Synthetic venture"}')`,
    [request.id],
  );
}

async function seedDeferredOpeningBalanceEvidence(client, ids) {
  // OPENING_BALANCE does not exist in the baseline enum, so it cannot be a
  // legal pre-expand brownfield row. Exercise its nearest transitional state
  // after enum expansion and confirm no delta is invented.
  ids.uncertainOpeningBalance = (
    await client.query(
      `INSERT INTO "InventoryMovement" (type,quantity,"quantityDelta",reason,"itemId","createdById") VALUES ('OPENING_BALANCE',5,NULL,'Synthetic uncertain opening balance',$1,$2) RETURNING id`,
      [ids.item.id, ids.user.id],
    )
  ).rows[0];
}

async function verifyDeferredEvidence(client, ids) {
  const [mappedAttendance] = (
    await client.query(
      `SELECT "convocationId" FROM "AssemblyAttendance" WHERE id=$1`,
      [ids.attendance.id],
    )
  ).rows;
  assert(
    mappedAttendance.convocationId === ids.convocation.id,
    'exact-attendance-link',
  );

  const [unresolvedAttendance] = (
    await client.query(
      `SELECT status,"convocationId" FROM "AssemblyAttendance" WHERE id=$1`,
      [ids.unresolvedAttendance.id],
    )
  ).rows;
  assert(
    unresolvedAttendance.status === 'JUSTIFIED' &&
      unresolvedAttendance.convocationId === null,
    'deferred-justified-attendance',
  );

  const [unresolvedJustification] = (
    await client.query(
      `SELECT "attendanceId" FROM "AbsenceJustification" WHERE id=$1`,
      [ids.unresolvedJustification.id],
    )
  ).rows;
  assert(
    unresolvedJustification.attendanceId === ids.unresolvedAttendance.id,
    'exact-justification-link-with-unresolved-convocation',
  );

  const [ambiguousPayment] = (
    await client.query(
      `SELECT "movementId","financialMethod" FROM "Payment" WHERE id=$1`,
      [ids.ambiguousPayment.id],
    )
  ).rows;
  assert(
    ambiguousPayment.movementId === null &&
      ambiguousPayment.financialMethod === 'CASH',
    'deferred-ambiguous-payment-movement',
  );
  const [ambiguousCandidateCount] = (
    await client.query(
      `SELECT count(*)::integer AS count FROM "FinancialMovement" WHERE source='RESERVATION_PAYMENT' AND "sourceId"=$1`,
      [ids.ambiguousPayment.id],
    )
  ).rows;
  assert(
    ambiguousCandidateCount.count === 2,
    'ambiguous-payment-source-fixture',
  );
  const [mappedPayment] = (
    await client.query(`SELECT "movementId" FROM "Payment" WHERE id=$1`, [
      ids.payment.id,
    ])
  ).rows;
  assert(mappedPayment.movementId === ids.movement.id, 'exact-payment-link');

  const [unmatchedMembership] = (
    await client.query(
      `SELECT "positionId","affiliateId" FROM "BoardAppointment" WHERE id=$1`,
      [ids.unmatchedGovernanceMembership.id],
    )
  ).rows;
  assert(
    unmatchedMembership.positionId === null &&
      unmatchedMembership.affiliateId === null,
    'deferred-unmatched-governance-membership',
  );

  const [adjustment, openingBalance] = await Promise.all([
    client.query(
      `SELECT "quantityDelta" FROM "InventoryMovement" WHERE id=$1`,
      [ids.uncertainAdjustment.id],
    ),
    client.query(
      `SELECT "quantityDelta" FROM "InventoryMovement" WHERE id=$1`,
      [ids.uncertainOpeningBalance.id],
    ),
  ]);
  assert(
    adjustment.rows[0].quantityDelta === null &&
      openingBalance.rows[0].quantityDelta === null,
    'deferred-inventory-ledger-uncertainty',
  );

  const [reversal] = (
    await client.query(
      `SELECT "reversalOfId" FROM "FinancialMovement" WHERE id=$1`,
      [ids.donationReversalMovement.id],
    )
  ).rows;
  assert(
    reversal.reversalOfId === ids.donationMovement.id,
    'exact-donation-reversal-evidence',
  );

  const [loan] = (
    await client.query(
      `SELECT "checkoutMovementId","returnMovementId","cancellationMovementId" FROM "InventoryLoan" WHERE id=$1`,
      [ids.uncertainLoan.id],
    )
  ).rows;
  assert(
    loan.checkoutMovementId === null &&
      loan.returnMovementId === null &&
      loan.cancellationMovementId === null,
    'deferred-inventory-loan-movement-evidence',
  );
}

async function verifySchemaInventory(client) {
  const schema = await readFile(path.join(prismaRoot, 'schema.prisma'), 'utf8');
  const models = [...schema.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)];
  assert(models.length === 50, 'schema-model-count');
  assert(
    models.filter(([_, name]) => name !== 'IdentityReconciliationManifest')
      .length === 49,
    'persistent-model-count',
  );
  const relationships = models
    .filter(([_, name]) => name !== 'IdentityReconciliationManifest')
    .reduce(
      (sum, match) =>
        sum + (match[2].match(/@relation\([^\n]*fields:\s*\[/g) ?? []).length,
      0,
    );
  assert(relationships === 77, 'persistent-relationship-count');
  for (const match of models) {
    const physical = /@@map\("([^"]+)"\)/.exec(match[2])?.[1] ?? match[1];
    const result = await client.query('SELECT to_regclass($1) AS relation', [
      `public."${physical}"`,
    ]);
    assert(result.rows[0].relation !== null, `missing-model-table-${match[1]}`);
  }
}

async function verifyInvariants(client) {
  const checks = {
    singleton: `SELECT count(*) = 1 AND min(id) = 1 AND max(id) = 1 AS ok FROM "InstitutionalProfile"`,
    identity: `SELECT count(*) = 0 AS ok FROM "User" WHERE "personId" IS NULL`,
    governanceDeferred: `SELECT count(*) = 1 AS ok FROM "BoardAppointment" WHERE "positionId" IS NULL OR "affiliateId" IS NULL`,
    assemblyDeferred: `SELECT count(*) = 1 AS ok FROM "AssemblyAttendance" WHERE "convocationId" IS NULL`,
    justification: `SELECT count(*) = 0 AS ok FROM "AbsenceJustification" WHERE "attendanceId" IS NULL`,
    finance: `SELECT count(*) = 0 AS ok FROM "FinancialMovement" WHERE "accountId" IS NULL OR status IS NULL`,
    paymentDeferred: `SELECT count(*) = 1 AS ok FROM "Payment" WHERE "movementId" IS NULL OR "financialMethod" IS NULL`,
    inventoryDeferred: `SELECT count(*) = 2 AS ok FROM "InventoryMovement" WHERE "quantityDelta" IS NULL`,
    inventoryNonZero: `SELECT count(*) = 0 AS ok FROM "InventoryMovement" WHERE "quantityDelta" = 0`,
    volunteering: `SELECT count(*) = 1 AS ok FROM "VolunteerAttendance" WHERE "creditedHours" = 2`,
    venture: `SELECT count(*) = 1 AS ok FROM "Venture" WHERE "publicationStatus"='PUBLISHED' AND status='ACTIVE'`,
  };
  for (const [name, sql] of Object.entries(checks))
    assert((await client.query(sql)).rows[0].ok === true, `invariant-${name}`);
  const partials = await client.query(
    `SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname IN ('VolunteerApplication_pending_person_key','VentureAssociation_open_person_venture_key','GovernanceMembership_active_seat_key')`,
  );
  assert(partials.rowCount === 3, 'partial-indexes');

  const safeChecks = [
    'User_failedLoginAttempts_check',
    'GovernanceTerm_dates_target_check',
    'GovernanceMembership_seat_target_check',
    'GovernanceMembership_dates_target_check',
    'AbsenceJustification_attachment_size_check',
    'AssemblyAttendance_target_status_check',
    'Reservation_dates_check',
    'ReservableResource_pricing_check',
    'FinancialCharge_amount_check',
    'Payment_amount_check',
    'FinancialMovement_amount_check',
    'FinancialMovement_not_self_reversal_check',
    'FinancialMovement_void_metadata_check',
    'Donation_amount_check',
    'InventoryItem_quantities_check',
    'InventoryMovement_delta_check',
    'InventoryLoan_quantity_dates_check',
    'InventoryLoan_status_evidence_check',
  ];
  const checkRows = await client.query(
    `SELECT conname, convalidated FROM pg_constraint WHERE conname = ANY($1::text[])`,
    [safeChecks],
  );
  assert(checkRows.rowCount === safeChecks.length, 'safe-check-inventory');
  assert(
    checkRows.rows.every((row) => row.convalidated === false),
    'safe-check-not-valid-state',
  );

  const preservedForeignKeys = [
    'BoardTerm_institutionalProfileId_fkey',
    'BoardAppointment_personId_fkey',
    'Affiliate_roleId_fkey',
    'AssemblyConvocation_roleId_fkey',
    'AssemblyAttendance_assemblyId_fkey',
    'AssemblyAttendance_affiliateId_fkey',
    'AbsenceJustification_assemblyId_affiliateId_fkey',
    'Donation_reversalMovementId_fkey',
  ];
  const fkRows = await client.query(
    `SELECT conname FROM pg_constraint WHERE contype='f' AND conname = ANY($1::text[])`,
    [preservedForeignKeys],
  );
  assert(
    fkRows.rowCount === preservedForeignKeys.length,
    'legacy-foreign-key-preservation',
  );
}

async function main() {
  // All URL parsing and exact-target checks happen before client creation,
  // schema reset, migrate deploy, or any other destructive operation.
  currentStage = 'validate-destructive-configuration';
  const url = validateDestructiveConfiguration();
  let sandbox;
  let client;
  try {
    currentStage = 'prepare-sandbox';
    sandbox = await mkdtemp(path.join(backendRoot, '.frozen-v1.1-acceptance-'));
    const sandboxMigrations = await prepareSandbox(sandbox);
    currentStage = 'connect-database';
    client = new Client({ connectionString: url });
    await client.connect();
    currentStage = 'reset-public-before-baseline';
    await resetPublic(client);
    currentStage = 'deploy-baseline';
    migrate(sandbox, url);
    currentStage = 'seed-brownfield';
    const ids = await seedBrownfield(client);
    currentStage = 'snapshot-brownfield';
    const before = await snapshot(client);
    const beforeFingerprint = fingerprint(before);
    const beforeGroupFingerprints = groupFingerprints(before);
    currentStage = 'copy-target-migrations';
    for (const migration of targetMigrations)
      await cp(
        path.join(sourceMigrations, migration),
        path.join(sandboxMigrations, migration),
        { recursive: true },
      );
    currentStage = 'deploy-target-migrations';
    migrate(sandbox, url);
    currentStage = 'prepare-backfill-evidence';
    await prepareSyntheticEvidence(client, ids);
    const backfillReport = path.join(sandbox, 'backfill-report.json');
    currentStage = 'run-first-backfill';
    runBackfill(url, backfillReport);
    const backfillEvidence = JSON.parse(await readFile(backfillReport, 'utf8'));
    assert(
      backfillEvidence.mode === 'APPLY_EVIDENCE_ONLY',
      'evidence-backfill-report',
    );
    currentStage = 'verify-first-backfill';
    await applySyntheticAttestations(client, ids);
    const after = await snapshot(client);
    assert(
      fingerprint(after) === beforeFingerprint,
      'brownfield-fingerprint-preservation',
    );
    assert(
      JSON.stringify(groupFingerprints(after)) ===
        JSON.stringify(beforeGroupFingerprints),
      'brownfield-group-fingerprint-preservation',
    );
    currentStage = 'seed-deferred-evidence';
    await seedDeferredOpeningBalanceEvidence(client, ids);
    const beforeSecondBackfill = await snapshot(client);
    const beforeSecondBackfillFingerprint = fingerprint(beforeSecondBackfill);
    const secondBackfillReport = path.join(
      sandbox,
      'backfill-report-second.json',
    );
    currentStage = 'run-second-backfill';
    runBackfill(url, secondBackfillReport);
    const secondBackfillEvidence = JSON.parse(
      await readFile(secondBackfillReport, 'utf8'),
    );
    assert(
      secondBackfillEvidence.mode === 'APPLY_EVIDENCE_ONLY',
      'second-evidence-backfill-report',
    );
    assert(
      Object.keys(secondBackfillEvidence.changes).length === 15 &&
        Object.values(secondBackfillEvidence.changes).every(
          (changedRows) => changedRows === 0,
        ),
      'evidence-backfill-idempotent-row-counts',
    );
    assert(
      fingerprint(await snapshot(client)) === beforeSecondBackfillFingerprint,
      'evidence-backfill-idempotent-fingerprint',
    );
    currentStage = 'verify-deferred-evidence';
    await verifyDeferredEvidence(client, ids);
    currentStage = 'seed-target-only';
    await seedTargetOnly(client, ids);
    currentStage = 'verify-schema-inventory';
    await verifySchemaInventory(client);
    currentStage = 'verify-invariants';
    await verifyInvariants(client);
    process.stdout.write('Frozen Target V1.1 disposable acceptance passed.\n');
  } finally {
    if (client) {
      try {
        await resetPublic(client);
      } finally {
        await client.end();
      }
    }
    if (sandbox) await rm(sandbox, { recursive: true, force: true });
  }
}

main().catch((error) => {
  const message =
    error instanceof Error &&
    error.message.startsWith('frozen-v1.1 acceptance failed:')
      ? error.message
      : `frozen-v1.1 acceptance failed: unexpected-error; stage=${currentStage}; error=${safeDiagnostic(error instanceof Error ? `${error.name}: ${error.message}` : error) || 'unknown'}`;
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
