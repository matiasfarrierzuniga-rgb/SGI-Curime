#!/usr/bin/env node

import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import {
  buildAbortReasons,
  classifyPreflightState,
  compareInstitutionalRoots,
} from './reconcile-organization-profile-preflight-lib.mjs';

const { Client } = pg;

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(scriptDirectory, '..');

const LEGACY_TABLE = 'InstitutionalProfile';
const CANONICAL_TABLE = 'OrganizationProfile';

const PROTECTED_MIGRATIONS = [
  {
    name: '20260920120000_add_institutional_profile',
    path: resolve(
      backendRoot,
      'prisma/migrations/20260920120000_add_institutional_profile/migration.sql',
    ),
  },
  {
    name: '20260922120000_add_institutional_board',
    path: resolve(
      backendRoot,
      'prisma/migrations/20260922120000_add_institutional_board/migration.sql',
    ),
  },
];

const LEGACY_COLUMNS = [
  'id',
  'legalName',
  'legalIdentification',
  'dinadecoRegistrationCode',
  'dinadecoRegion',
  'organizationType',
  'province',
  'canton',
  'district',
  'locality',
  'correspondenceAddress',
  'phone',
  'telefax',
  'email',
  'createdAt',
  'updatedAt',
];

const CANONICAL_COLUMNS = [
  'id',
  'legalName',
  'legalIdentification',
  'dinadecoRegistrationCode',
  'region',
  'organizationType',
  'province',
  'canton',
  'district',
  'physicalAddress',
  'notificationPhone',
  'notificationFax',
  'notificationEmail',
  'createdAt',
  'updatedAt',
];

function requiredConnectionString() {
  const value = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!value) {
    throw new Error('DIRECT_URL or DATABASE_URL is required.');
  }
  return value;
}

async function tableExists(client, tableName) {
  const result = await client.query(
    "SELECT EXISTS (" +
      "SELECT 1 FROM information_schema.tables " +
      "WHERE table_schema = 'public' AND table_name = $1" +
      ') AS "exists"',
    [tableName],
  );
  return Boolean(result.rows[0]?.exists);
}

async function readColumns(client, tableName) {
  const result = await client.query(
    "SELECT column_name FROM information_schema.columns " +
      "WHERE table_schema = 'public' AND table_name = $1 " +
      'ORDER BY ordinal_position',
    [tableName],
  );
  return new Set(result.rows.map((row) => row.column_name));
}

function missingColumns(actual, expected) {
  return expected.filter((column) => !actual.has(column));
}

async function singletonSummary(client, tableName) {
  const sql =
    'SELECT COUNT(*)::int AS "rowCount", ' +
    'COUNT(*) FILTER (WHERE "id" = 1)::int AS "idOneCount" ' +
    'FROM "' +
    tableName +
    '"';
  const result = await client.query(sql);
  return {
    rowCount: Number(result.rows[0]?.rowCount ?? 0),
    idOneCount: Number(result.rows[0]?.idOneCount ?? 0),
  };
}

async function rowOne(client, tableName, columns) {
  const projection = columns.map((column) => '"' + column + '"').join(', ');
  const result = await client.query(
    'SELECT ' + projection + ' FROM "' + tableName + '" WHERE "id" = 1 LIMIT 1',
  );
  return result.rows[0] ?? null;
}

async function expectedChecksums() {
  const entries = [];
  for (const migration of PROTECTED_MIGRATIONS) {
    const content = await readFile(migration.path);
    entries.push({
      name: migration.name,
      checksum: createHash('sha256').update(content).digest('hex'),
    });
  }
  return entries;
}

async function migrationHistory(client) {
  const migrationTablePresent = await tableExists(client, '_prisma_migrations');
  const expected = await expectedChecksums();

  if (!migrationTablePresent) {
    return {
      supported: false,
      issues: ['PRISMA_MIGRATION_TABLE_MISSING'],
      records: expected.map(({ name }) => ({
        name,
        applied: false,
        checksumMatches: false,
        finished: false,
        rolledBack: false,
      })),
    };
  }

  const names = expected.map(({ name }) => name);
  const result = await client.query(
    'SELECT migration_name, checksum, finished_at, rolled_back_at, applied_steps_count ' +
      'FROM "_prisma_migrations" ' +
      'WHERE migration_name = ANY($1::text[]) ' +
      'ORDER BY started_at',
    [names],
  );

  const issues = [];
  const records = [];

  for (const expectedMigration of expected) {
    const matching = result.rows.filter(
      (row) => row.migration_name === expectedMigration.name,
    );

    if (matching.length !== 1) {
      issues.push(
        matching.length === 0
          ? 'MIGRATION_MISSING:' + expectedMigration.name
          : 'MIGRATION_DUPLICATED:' + expectedMigration.name,
      );
    }

    const row = matching[0];
    const checksumMatches = row?.checksum === expectedMigration.checksum;
    const finished = Boolean(row?.finished_at);
    const rolledBack = Boolean(row?.rolled_back_at);
    const appliedSteps = Number(row?.applied_steps_count ?? 0);

    if (row && !checksumMatches) {
      issues.push('MIGRATION_CHECKSUM_MISMATCH:' + expectedMigration.name);
    }
    if (row && (!finished || rolledBack || appliedSteps < 1)) {
      issues.push('MIGRATION_NOT_CLEANLY_APPLIED:' + expectedMigration.name);
    }

    records.push({
      name: expectedMigration.name,
      applied: Boolean(row),
      checksumMatches,
      finished,
      rolledBack,
    });
  }

  return {
    supported: issues.length === 0,
    issues,
    records,
  };
}

async function inspectBoard(client) {
  const present = await tableExists(client, 'BoardTerm');
  if (!present) {
    return {
      present: false,
      rowCount: 0,
      invalidSingletonReferenceCount: 0,
      foreignKeyTarget: null,
      foreignKeySupported: true,
    };
  }

  const counts = await client.query(
    'SELECT COUNT(*)::int AS "rowCount", ' +
      'COUNT(*) FILTER (WHERE "institutionalProfileId" <> 1)::int AS "invalidSingletonReferenceCount" ' +
      'FROM "BoardTerm"',
  );

  const fk = await client.query(
    'SELECT confrelid::regclass::text AS "target" ' +
      'FROM pg_constraint ' +
      'WHERE conrelid = \'"BoardTerm"\'::regclass ' +
      "AND conname = 'BoardTerm_institutionalProfileId_fkey' " +
      "AND contype = 'f' LIMIT 1",
  );

  const rawTarget = fk.rows[0]?.target ?? null;
  const normalizedTarget =
    rawTarget === null
      ? null
      : String(rawTarget).replace(/^public\./, '').replaceAll('"', '');

  return {
    present: true,
    rowCount: Number(counts.rows[0]?.rowCount ?? 0),
    invalidSingletonReferenceCount: Number(
      counts.rows[0]?.invalidSingletonReferenceCount ?? 0,
    ),
    foreignKeyTarget: normalizedTarget,
    foreignKeySupported:
      normalizedTarget === LEGACY_TABLE || normalizedTarget === CANONICAL_TABLE,
  };
}

async function authoritativeConfigurationAvailable() {
  const path = process.env.RECONCILIATION_AUTHORITY_CONFIG_PATH?.trim();
  if (!path) return false;

  try {
    const details = await stat(resolve(path));
    return details.isFile() && details.size > 0;
  } catch {
    return false;
  }
}

function environmentOwnershipDeclared() {
  return Boolean(
    process.env.RECONCILIATION_ENVIRONMENT_ID?.trim() &&
      process.env.RECONCILIATION_ENVIRONMENT_OWNER?.trim(),
  );
}

async function main() {
  const client = new Client({
    connectionString: requiredConnectionString(),
    application_name: 'sgi-organization-profile-preflight',
  });

  let transactionStarted = false;

  try {
    await client.connect();
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    transactionStarted = true;

    const readOnlyResult = await client.query(
      "SELECT current_setting('transaction_read_only') AS \"readOnly\"",
    );
    const transactionReadOnly = readOnlyResult.rows[0]?.readOnly === 'on';
    if (!transactionReadOnly) {
      throw new Error('Database did not enter a read-only transaction.');
    }

    const history = await migrationHistory(client);
    const [legacyPresent, canonicalPresent] = await Promise.all([
      tableExists(client, LEGACY_TABLE),
      tableExists(client, CANONICAL_TABLE),
    ]);

    const physicalIssues = [];

    if (legacyPresent) {
      const legacyColumns = await readColumns(client, LEGACY_TABLE);
      const missing = missingColumns(legacyColumns, LEGACY_COLUMNS);
      physicalIssues.push(
        ...missing.map((field) => 'LEGACY_COLUMN_MISSING:' + field),
      );
    }

    if (canonicalPresent) {
      const canonicalColumns = await readColumns(client, CANONICAL_TABLE);
      const missing = missingColumns(canonicalColumns, CANONICAL_COLUMNS);
      physicalIssues.push(
        ...missing.map((field) => 'CANONICAL_COLUMN_MISSING:' + field),
      );
    }

    const legacySingleton = legacyPresent
      ? await singletonSummary(client, LEGACY_TABLE)
      : { rowCount: 0, idOneCount: 0 };
    const canonicalSingleton = canonicalPresent
      ? await singletonSummary(client, CANONICAL_TABLE)
      : { rowCount: 0, idOneCount: 0 };

    const multipleSingletonRows =
      legacySingleton.rowCount > 1 || canonicalSingleton.rowCount > 1;
    const invalidSingletonIdentity =
      (legacyPresent &&
        (legacySingleton.rowCount !== 1 || legacySingleton.idOneCount !== 1)) ||
      (canonicalPresent &&
        (canonicalSingleton.rowCount !== 1 || canonicalSingleton.idOneCount !== 1));

    if (invalidSingletonIdentity) {
      physicalIssues.push('SINGLETON_IDENTITY_INVALID');
    }

    let rootComparison = {
      equivalent: true,
      comparedFields: [],
      conflictingFields: [],
    };

    if (
      legacyPresent &&
      canonicalPresent &&
      physicalIssues.length === 0 &&
      legacySingleton.rowCount === 1 &&
      canonicalSingleton.rowCount === 1
    ) {
      const [legacyRow, canonicalRow] = await Promise.all([
        rowOne(client, LEGACY_TABLE, LEGACY_COLUMNS),
        rowOne(client, CANONICAL_TABLE, CANONICAL_COLUMNS),
      ]);
      rootComparison = compareInstitutionalRoots(legacyRow, canonicalRow);
    }

    const classification = classifyPreflightState({
      historySupported: history.supported,
      physicalSupported: physicalIssues.length === 0,
      legacyPresent,
      canonicalPresent,
      rootsEquivalent: rootComparison.equivalent,
    });

    const board = await inspectBoard(client);
    const ownershipDeclared = environmentOwnershipDeclared();
    const authorityAvailable = await authoritativeConfigurationAvailable();

    const blockers = buildAbortReasons({
      classification,
      multipleSingletonRows,
      invalidSingletonIdentity,
      environmentOwnershipDeclared: ownershipDeclared,
      authoritativeConfigurationAvailable: authorityAvailable,
      boardForeignKeySupported: board.foreignKeySupported,
    });

    if (board.invalidSingletonReferenceCount > 0) {
      blockers.push('BOARD_TERM_NON_SINGLETON_REFERENCE');
    }

    const uniqueBlockers = [...new Set(blockers)];

    const output = {
      tool: 'sgi-organization-profile-preflight',
      mode: 'READ_ONLY',
      classification,
      mutationGate:
        uniqueBlockers.length === 0 ? 'ELIGIBLE_FOR_CHECKPOINT_REVIEW' : 'BLOCKED',
      blockers: uniqueBlockers,
      evidence: {
        transactionReadOnly,
        migrationHistory: history,
        physicalIssues,
        roots: {
          legacy: {
            tablePresent: legacyPresent,
            rowCount: legacySingleton.rowCount,
            idOneCount: legacySingleton.idOneCount,
          },
          canonical: {
            tablePresent: canonicalPresent,
            rowCount: canonicalSingleton.rowCount,
            idOneCount: canonicalSingleton.idOneCount,
          },
        },
        rootComparison: {
          comparedFields: rootComparison.comparedFields,
          conflictingFields: rootComparison.conflictingFields,
        },
        board,
        controls: {
          environmentOwnershipDeclared: ownershipDeclared,
          authoritativeConfigurationAvailable: authorityAvailable,
        },
      },
    };

    console.log(JSON.stringify(output, null, 2));
    process.exitCode = uniqueBlockers.length === 0 ? 0 : 2;
  } finally {
    if (transactionStarted) {
      await client.query('ROLLBACK').catch(() => undefined);
    }
    await client.end().catch(() => undefined);
  }
}

main().catch((error) => {
  const message =
    error instanceof Error ? error.message.split('\n')[0] : 'Unknown preflight failure.';
  console.error('organization-profile preflight failed: ' + message);
  process.exitCode = 1;
});
