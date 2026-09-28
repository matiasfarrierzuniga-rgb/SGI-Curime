import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../generated/prisma/client';
import {
  HISTORICAL_CANONICAL_MIGRATION,
  CANONICAL_SHADOW_PREPARATION_MIGRATION,
  PROTECTED_MIGRATIONS,
  classifyInstitutionalPreflight,
  safeInstitutionalPreflightReport,
  type InstitutionalPreflightEvidence,
  type InstitutionalRootRow,
  type MigrationRecord,
  type StructuralState,
} from '../src/organization-profile/institutional-profile-preflight';

type Queryable = {
  $queryRaw<T>(query: Prisma.Sql): Promise<T>;
};

type CountRow = { count: bigint | number };

type ColumnMetadata = {
  tableName: string;
  columnName: string;
  dataType: string;
  udtName: string;
  isNullable: 'YES' | 'NO';
  characterMaximumLength: number | null;
};

type ConstraintMetadata = { name: string; definition: string };
type EnumLabel = { label: string };
type ForeignKeyMetadata = {
  targetSchema: string;
  targetName: string;
  targetColumn: string;
};
type ForeignKeyTargetRow = Pick<ForeignKeyMetadata, 'targetSchema' | 'targetName'>;

export async function inspectInstitutionalPreflight(
  database: Queryable,
): Promise<ReturnType<typeof classifyInstitutionalPreflight>> {
  const [metadata] = await database.$queryRaw<{ present: boolean }[]>(Prisma.sql`
    SELECT to_regclass('public._prisma_migrations') IS NOT NULL AS present
  `);
  const migrationMetadataPresent = metadata?.present === true;
  const migrations = migrationMetadataPresent
    ? await database.$queryRaw<MigrationRecord[]>(Prisma.sql`
        SELECT migration_name AS "migrationName",
               finished_at AS "finishedAt",
               rolled_back_at AS "rolledBackAt",
               applied_steps_count AS "appliedStepsCount"
        FROM public."_prisma_migrations"
        WHERE migration_name IN (${Prisma.join([
          ...PROTECTED_MIGRATIONS,
          HISTORICAL_CANONICAL_MIGRATION,
          CANONICAL_SHADOW_PREPARATION_MIGRATION,
        ])})
      `)
    : [];
  const [tables] = await database.$queryRaw<
    { legacy: boolean; canonical: boolean; boardTerm: boolean; boardAppointment: boolean }[]
  >(Prisma.sql`
    SELECT to_regclass('public."InstitutionalProfile"') IS NOT NULL AS legacy,
           to_regclass('public."OrganizationProfile"') IS NOT NULL AS canonical,
           to_regclass('public."BoardTerm"') IS NOT NULL AS "boardTerm",
           to_regclass('public."BoardAppointment"') IS NOT NULL AS "boardAppointment"
  `);
  const legacyTablePresent = tables?.legacy === true;
  const canonicalTablePresent = tables?.canonical === true;

  const legacy = legacyTablePresent
    ? await inspectLegacyRoot(database)
    : { count: null, singletonPresent: null, row: null };
  const canonical = canonicalTablePresent
    ? await inspectCanonicalRoot(database)
    : { count: null, singletonPresent: null, row: null };
  const boardTermCount = tables?.boardTerm
    ? await countRows(database, 'BoardTerm')
    : null;
  const boardAppointmentCount = tables?.boardAppointment
    ? await countRows(database, 'BoardAppointment')
    : null;
  const boardTermForeignKeyTarget = tables?.boardTerm
    ? await inspectBoardTermForeignKey(database)
    : null;
  const physicalState = await inspectPhysicalState(database, {
    legacyTablePresent,
    boardTermPresent: tables?.boardTerm === true,
  });

  const evidence: InstitutionalPreflightEvidence = {
    migrationMetadataPresent,
    migrations,
    legacyTablePresent,
    canonicalTablePresent,
    legacyRowCount: legacy.count,
    legacySingletonPresent: legacy.singletonPresent,
    canonicalRowCount: canonical.count,
    canonicalSingletonPresent: canonical.singletonPresent,
    legacyRow: legacy.row,
    canonicalRow: canonical.row,
    boardTermCount,
    boardAppointmentCount,
    boardTermForeignKeyTarget,
    boardTermForeignKeyTargetColumn: physicalState.boardTermForeignKeyTargetColumn,
    legacySingletonConstraint: physicalState.legacySingletonConstraint,
    legacyFieldDefinitions: physicalState.legacyFieldDefinitions,
    canonicalShadowDefinitions: physicalState.canonicalShadowDefinitions,
    institutionalOrganizationTypeEnum: physicalState.institutionalOrganizationTypeEnum,
  };
  return classifyInstitutionalPreflight(evidence);
}

async function inspectLegacyRoot(database: Queryable) {
  const [count, rows] = await Promise.all([
    countRows(database, 'InstitutionalProfile'),
    database.$queryRaw<InstitutionalRootRow[]>(Prisma.sql`
      SELECT "id", "legalName", "legalIdentification", "dinadecoRegistrationCode",
             "organizationType", "dinadecoRegion" AS "region", "province", "canton",
             "district", "correspondenceAddress" AS "physicalAddress",
             "phone" AS "notificationPhone", "telefax" AS "notificationFax",
             "email" AS "notificationEmail"
      FROM public."InstitutionalProfile" WHERE "id" = ${1}
    `),
  ]);
  return { count, singletonPresent: rows.length === 1, row: rows[0] ?? null };
}

async function inspectCanonicalRoot(database: Queryable) {
  const [count, rows] = await Promise.all([
    countRows(database, 'OrganizationProfile'),
    database.$queryRaw<InstitutionalRootRow[]>(Prisma.sql`
      SELECT "id", "legalName", "legalIdentification", "dinadecoRegistrationCode",
             "organizationType", "region", "province", "canton", "district",
             "physicalAddress", "notificationPhone", "notificationFax", "notificationEmail"
      FROM public."OrganizationProfile" WHERE "id" = ${1}
    `),
  ]);
  return { count, singletonPresent: rows.length === 1, row: rows[0] ?? null };
}

async function countRows(database: Queryable, table: 'InstitutionalProfile' | 'OrganizationProfile' | 'BoardTerm' | 'BoardAppointment'): Promise<number> {
  const queries = {
    InstitutionalProfile: Prisma.sql`SELECT count(*) AS count FROM public."InstitutionalProfile"`,
    OrganizationProfile: Prisma.sql`SELECT count(*) AS count FROM public."OrganizationProfile"`,
    BoardTerm: Prisma.sql`SELECT count(*) AS count FROM public."BoardTerm"`,
    BoardAppointment: Prisma.sql`SELECT count(*) AS count FROM public."BoardAppointment"`,
  };
  const [result] = await database.$queryRaw<CountRow[]>(queries[table]);
  return Number(result?.count ?? 0);
}

async function inspectBoardTermForeignKey(database: Queryable): Promise<string | null> {
  const rows = await database.$queryRaw<ForeignKeyTargetRow[]>(Prisma.sql`
    SELECT target_schema.nspname AS "targetSchema", target.relname AS "targetName"
    FROM pg_constraint constraint
    JOIN pg_class source ON source.oid = constraint.conrelid
    JOIN pg_namespace source_schema ON source_schema.oid = source.relnamespace
    JOIN pg_class target ON target.oid = constraint.confrelid
    JOIN pg_namespace target_schema ON target_schema.oid = target.relnamespace
    WHERE constraint.contype = 'f'
      AND source_schema.nspname = 'public'
      AND source.relname = 'BoardTerm'
      AND pg_get_constraintdef(constraint.oid) LIKE '%"institutionalProfileId"%'
  `);
  return rows.length === 1
    ? `${rows[0].targetSchema}.${rows[0].targetName}`
    : null;
}

/** Catalog-only inspection. It reads no institutional or board values. */
async function inspectPhysicalState(
  database: Queryable,
  tables: { legacyTablePresent: boolean; boardTermPresent: boolean },
): Promise<{
  legacySingletonConstraint: StructuralState | null;
  legacyFieldDefinitions: StructuralState | null;
  canonicalShadowDefinitions: StructuralState | null;
  institutionalOrganizationTypeEnum: StructuralState;
  boardTermForeignKeyTargetColumn: string | null;
}> {
  const [columns, constraints, enumLabels, boardForeignKeys] = await Promise.all([
    database.$queryRaw<ColumnMetadata[]>(Prisma.sql`
      SELECT table_name AS "tableName", column_name AS "columnName",
             data_type AS "dataType", udt_name AS "udtName",
             is_nullable AS "isNullable",
             character_maximum_length AS "characterMaximumLength"
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'InstitutionalProfile'
    `),
    database.$queryRaw<ConstraintMetadata[]>(Prisma.sql`
      SELECT constraint.conname AS name, pg_get_constraintdef(constraint.oid) AS definition
      FROM pg_constraint constraint
      JOIN pg_class relation ON relation.oid = constraint.conrelid
      JOIN pg_namespace schema ON schema.oid = relation.relnamespace
      WHERE schema.nspname = 'public' AND relation.relname = 'InstitutionalProfile'
        AND constraint.contype = 'c'
    `),
    database.$queryRaw<EnumLabel[]>(Prisma.sql`
      SELECT enum_label.enumlabel AS label
      FROM pg_type enum_type
      JOIN pg_namespace schema ON schema.oid = enum_type.typnamespace
      JOIN pg_enum enum_label ON enum_label.enumtypid = enum_type.oid
      WHERE schema.nspname = 'public' AND enum_type.typname = 'InstitutionalOrganizationType'
      ORDER BY enum_label.enumsortorder
    `),
    tables.boardTermPresent
      ? database.$queryRaw<ForeignKeyMetadata[]>(Prisma.sql`
          SELECT target_schema.nspname AS "targetSchema", target.relname AS "targetName",
                 target_attribute.attname AS "targetColumn"
          FROM pg_constraint constraint
          JOIN pg_class source ON source.oid = constraint.conrelid
          JOIN pg_namespace source_schema ON source_schema.oid = source.relnamespace
          JOIN pg_class target ON target.oid = constraint.confrelid
          JOIN pg_namespace target_schema ON target_schema.oid = target.relnamespace
          JOIN LATERAL unnest(constraint.conkey) WITH ORDINALITY source_key(attribute_number, position) ON true
          JOIN pg_attribute source_attribute ON source_attribute.attrelid = source.oid
            AND source_attribute.attnum = source_key.attribute_number
          JOIN LATERAL unnest(constraint.confkey) WITH ORDINALITY target_key(attribute_number, position)
            ON target_key.position = source_key.position
          JOIN pg_attribute target_attribute ON target_attribute.attrelid = target.oid
            AND target_attribute.attnum = target_key.attribute_number
          WHERE constraint.contype = 'f' AND source_schema.nspname = 'public'
            AND source.relname = 'BoardTerm' AND source_attribute.attname = 'institutionalProfileId'
        `)
      : Promise.resolve([]),
  ]);

  return {
    legacySingletonConstraint: tables.legacyTablePresent
      ? inspectSingletonConstraint(constraints)
      : null,
    legacyFieldDefinitions: tables.legacyTablePresent
      ? inspectColumnDefinitions(columns, LEGACY_COLUMNS)
      : null,
    canonicalShadowDefinitions: tables.legacyTablePresent
      ? inspectColumnDefinitions(columns, CANONICAL_SHADOW_COLUMNS)
      : null,
    institutionalOrganizationTypeEnum: inspectEnumLabels(enumLabels),
    boardTermForeignKeyTargetColumn: boardForeignKeys.length === 1
      ? boardForeignKeys[0].targetColumn
      : null,
  };
}

const LEGACY_COLUMNS = [
  ['id', 'integer', 'int4', 'NO', null],
  ['legalName', 'text', 'text', 'YES', null], ['legalIdentification', 'text', 'text', 'YES', null],
  ['dinadecoRegistrationCode', 'text', 'text', 'YES', null], ['dinadecoRegion', 'text', 'text', 'YES', null],
  ['organizationType', 'USER-DEFINED', 'InstitutionalOrganizationType', 'YES', null],
  ['province', 'text', 'text', 'YES', null], ['canton', 'text', 'text', 'YES', null],
  ['district', 'text', 'text', 'YES', null], ['locality', 'text', 'text', 'YES', null],
  ['correspondenceAddress', 'text', 'text', 'YES', null], ['phone', 'text', 'text', 'YES', null],
  ['telefax', 'text', 'text', 'YES', null], ['email', 'text', 'text', 'YES', null],
] as const;

const CANONICAL_SHADOW_COLUMNS = [
  ['canonicalLegalName', 200], ['canonicalLegalIdentification', 64],
  ['canonicalDinadecoRegistrationCode', 64], ['canonicalOrganizationType', 100],
  ['canonicalRegion', 100], ['canonicalProvince', 100], ['canonicalCanton', 100],
  ['canonicalDistrict', 100], ['canonicalPhysicalAddress', 500],
  ['canonicalNotificationPhone', 40], ['canonicalNotificationFax', 40],
  ['canonicalNotificationEmail', 254],
] as const;

function inspectSingletonConstraint(constraints: readonly ConstraintMetadata[]): StructuralState {
  const singleton = constraints.filter((constraint) =>
    constraint.name === 'InstitutionalProfile_singleton_check'
    && /^CHECK\s*\(\s*\(?\s*"?id"?\s*=\s*1\s*\)?\s*\)$/.test(constraint.definition),
  );
  return singleton.length === 1 ? 'VALID' : constraints.length === 0 ? 'MISSING' : 'INVALID';
}

function inspectColumnDefinitions(
  columns: readonly ColumnMetadata[],
  expected: readonly (readonly [string, string, string, 'YES' | 'NO', number | null])[]
    | readonly (readonly [string, number])[],
): StructuralState {
  const expectedColumns = expected.map((column) => column[0]);
  const actual = columns.filter((column) => expectedColumns.includes(column.columnName));
  if (actual.length === 0) return 'MISSING';
  if (actual.length !== expected.length) return 'INVALID';
  return expected.every((definition) => {
    const column = actual.find((candidate) => candidate.columnName === definition[0]);
    return column !== undefined && (definition.length === 2
      ? column.dataType === 'character varying' && column.isNullable === 'YES'
        && column.characterMaximumLength === definition[1]
      : column.dataType === definition[1] && column.udtName === definition[2]
        && column.isNullable === definition[3] && column.characterMaximumLength === definition[4]);
  }) ? 'VALID' : 'INVALID';
}

function inspectEnumLabels(labels: readonly EnumLabel[]): StructuralState {
  if (labels.length === 0) return 'MISSING';
  return labels.length === 2 && labels[0].label === 'INTEGRAL' && labels[1].label === 'SPECIFIC'
    ? 'VALID'
    : 'INVALID';
}

function requiredDatabaseUrl(): string {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) throw new Error('Missing required environment variable: DATABASE_URL');
  return value;
}

async function main(): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: requiredDatabaseUrl() }),
  });
  try {
    console.log(JSON.stringify(safeInstitutionalPreflightReport(
      await inspectInstitutionalPreflight(prisma),
    )));
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(() => {
    console.error('Institutional profile preflight failed.');
    process.exitCode = 1;
  });
}
