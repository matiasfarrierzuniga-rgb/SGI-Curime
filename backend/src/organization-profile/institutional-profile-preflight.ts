export const PROTECTED_MIGRATIONS = [
  '20260920120000_add_institutional_profile',
  '20260922120000_add_institutional_board',
] as const;

export const HISTORICAL_CANONICAL_MIGRATION =
  '20260924120000_add_organization_profile';

export const CANONICAL_SHADOW_PREPARATION_MIGRATION =
  '20260923120000_add_institutional_profile_canonical_shadows';

export type StructuralState = 'VALID' | 'MISSING' | 'INVALID';

export type InstitutionalProfilePreflightClassification =
  | 'MAIN_LEGACY_ONLY'
  | 'CANONICAL_ONLY'
  | 'BOTH_EQUIVALENT'
  | 'BOTH_CONFLICTING'
  | 'NEITHER'
  | 'HISTORY_MISMATCH';

export interface MigrationRecord {
  migrationName: string;
  finishedAt: Date | string | null;
  rolledBackAt: Date | string | null;
  appliedStepsCount: number;
}

export interface InstitutionalRootRow {
  id: number;
  legalName: string | null;
  legalIdentification: string | null;
  dinadecoRegistrationCode: string | null;
  organizationType: string | null;
  region: string | null;
  province: string | null;
  canton: string | null;
  district: string | null;
  physicalAddress: string | null;
  notificationPhone: string | null;
  notificationFax: string | null;
  notificationEmail: string | null;
}

export interface InstitutionalPreflightEvidence {
  migrationMetadataPresent: boolean;
  migrations: readonly MigrationRecord[];
  legacyTablePresent: boolean;
  canonicalTablePresent: boolean;
  legacyRowCount: number | null;
  legacySingletonPresent: boolean | null;
  canonicalRowCount: number | null;
  canonicalSingletonPresent: boolean | null;
  legacyRow: InstitutionalRootRow | null;
  canonicalRow: InstitutionalRootRow | null;
  boardTermCount: number | null;
  boardAppointmentCount: number | null;
  boardTermForeignKeyTarget: string | null;
  boardTermForeignKeyTargetColumn?: string | null;
  legacySingletonConstraint?: StructuralState | null;
  legacyFieldDefinitions?: StructuralState | null;
  canonicalShadowDefinitions?: StructuralState | null;
  institutionalOrganizationTypeEnum?: StructuralState | null;
}

export interface InstitutionalPreflightReport {
  classification: InstitutionalProfilePreflightClassification;
  migrationMetadataPresent: boolean;
  legacyTablePresent: boolean;
  canonicalTablePresent: boolean;
  legacyRowCount: number | null;
  legacySingletonPresent: boolean | null;
  canonicalRowCount: number | null;
  canonicalSingletonPresent: boolean | null;
  boardTermCount: number | null;
  boardAppointmentCount: number | null;
  boardTermForeignKeyTarget: string | null;
  boardTermForeignKeyTargetColumn: string | null;
  legacySingletonConstraint: StructuralState | null;
  legacyFieldDefinitions: StructuralState | null;
  canonicalShadowDefinitions: StructuralState | null;
  institutionalOrganizationTypeEnum: StructuralState | null;
  conflictingFields: string[];
  historyProblems: string[];
}

const CANONICAL_FIELDS = [
  'legalName',
  'legalIdentification',
  'dinadecoRegistrationCode',
  'organizationType',
  'region',
  'province',
  'canton',
  'district',
  'physicalAddress',
  'notificationPhone',
  'notificationFax',
  'notificationEmail',
] as const;

type CanonicalField = (typeof CANONICAL_FIELDS)[number];

/**
 * Classifies table roots only. Singleton anomalies are reported as evidence so
 * task 1.5 can decide its mutation abort path without hiding physical state.
 */
export function classifyInstitutionalPreflight(
  evidence: InstitutionalPreflightEvidence,
): InstitutionalPreflightReport {
  const historyProblems = collectHistoryProblems(evidence);
  const conflictingFields = compareMappedRows(
    evidence.legacyRow,
    evidence.canonicalRow,
  );

  let classification: InstitutionalProfilePreflightClassification;
  if (historyProblems.length > 0) {
    classification = 'HISTORY_MISMATCH';
  } else if (evidence.legacyTablePresent && evidence.canonicalTablePresent) {
    classification =
      conflictingFields.length === 0 ? 'BOTH_EQUIVALENT' : 'BOTH_CONFLICTING';
  } else if (evidence.legacyTablePresent) {
    classification = 'MAIN_LEGACY_ONLY';
  } else if (evidence.canonicalTablePresent) {
    classification = 'CANONICAL_ONLY';
  } else {
    classification = 'NEITHER';
  }

  return {
    classification,
    migrationMetadataPresent: evidence.migrationMetadataPresent,
    legacyTablePresent: evidence.legacyTablePresent,
    canonicalTablePresent: evidence.canonicalTablePresent,
    legacyRowCount: evidence.legacyRowCount,
    legacySingletonPresent: evidence.legacySingletonPresent,
    canonicalRowCount: evidence.canonicalRowCount,
    canonicalSingletonPresent: evidence.canonicalSingletonPresent,
    boardTermCount: evidence.boardTermCount,
    boardAppointmentCount: evidence.boardAppointmentCount,
    boardTermForeignKeyTarget: evidence.boardTermForeignKeyTarget,
    boardTermForeignKeyTargetColumn: evidence.boardTermForeignKeyTargetColumn ?? null,
    legacySingletonConstraint: evidence.legacySingletonConstraint ?? null,
    legacyFieldDefinitions: evidence.legacyFieldDefinitions ?? null,
    canonicalShadowDefinitions: evidence.canonicalShadowDefinitions ?? null,
    institutionalOrganizationTypeEnum: evidence.institutionalOrganizationTypeEnum ?? null,
    conflictingFields,
    historyProblems,
  };
}

/** Returns only bounded structural diagnostics; never institutional values. */
export function safeInstitutionalPreflightReport(
  report: InstitutionalPreflightReport,
): Record<string, string | number | boolean | string[] | null> {
  return {
    classification: report.classification,
    migrationMetadataPresent: report.migrationMetadataPresent,
    legacyTablePresent: report.legacyTablePresent,
    canonicalTablePresent: report.canonicalTablePresent,
    legacyRowCount: report.legacyRowCount,
    legacySingletonPresent: report.legacySingletonPresent,
    canonicalRowCount: report.canonicalRowCount,
    canonicalSingletonPresent: report.canonicalSingletonPresent,
    boardTermCount: report.boardTermCount,
    boardAppointmentCount: report.boardAppointmentCount,
    boardTermForeignKeyTarget: report.boardTermForeignKeyTarget,
    boardTermForeignKeyTargetColumn: report.boardTermForeignKeyTargetColumn,
    legacySingletonConstraint: report.legacySingletonConstraint,
    legacyFieldDefinitions: report.legacyFieldDefinitions,
    canonicalShadowDefinitions: report.canonicalShadowDefinitions,
    institutionalOrganizationTypeEnum: report.institutionalOrganizationTypeEnum,
    conflictingFields: report.conflictingFields,
    historyProblems: report.historyProblems,
  };
}

function collectHistoryProblems(
  evidence: InstitutionalPreflightEvidence,
): string[] {
  if (!evidence.migrationMetadataPresent) return ['MIGRATION_METADATA_UNAVAILABLE'];

  const recordsByName = new Map<string, MigrationRecord[]>();
  for (const record of evidence.migrations) {
    const records = recordsByName.get(record.migrationName) ?? [];
    records.push(record);
    recordsByName.set(record.migrationName, records);
  }

  const protectedApplied = PROTECTED_MIGRATIONS.map((name) =>
    migrationState(recordsByName.get(name) ?? []),
  );
  const canonicalApplied = migrationState(
    recordsByName.get(HISTORICAL_CANONICAL_MIGRATION) ?? [],
  );
  const shadowPreparationApplied = migrationState(
    recordsByName.get(CANONICAL_SHADOW_PREPARATION_MIGRATION) ?? [],
  );
  const problems: string[] = [];

  if (protectedApplied.some((state) => state === 'INVALID')) {
    problems.push('PROTECTED_MIGRATION_INVALID');
  }
  if (canonicalApplied === 'INVALID') problems.push('CANONICAL_MIGRATION_INVALID');
  if (shadowPreparationApplied === 'INVALID') {
    problems.push('SHADOW_PREPARATION_MIGRATION_INVALID');
  }

  const protectedState = protectedApplied.every((state) => state === 'APPLIED')
    ? 'APPLIED'
    : protectedApplied.every((state) => state === 'ABSENT')
      ? 'ABSENT'
      : 'PARTIAL';
  if (protectedState === 'PARTIAL') problems.push('PROTECTED_MIGRATIONS_PARTIAL');

  problems.push(...collectPhysicalStateProblems(
    evidence,
    protectedState,
    shadowPreparationApplied,
  ));

  if (evidence.legacyTablePresent && evidence.canonicalTablePresent) {
    if (protectedState !== 'APPLIED') problems.push('LEGACY_PROVENANCE_INVALID');
    if (canonicalApplied !== 'APPLIED') problems.push('CANONICAL_PROVENANCE_INVALID');
  } else if (evidence.legacyTablePresent) {
    if (protectedState !== 'APPLIED') problems.push('LEGACY_PROVENANCE_INVALID');
    if (canonicalApplied === 'APPLIED') problems.push('LEGACY_ROOT_WITH_CANONICAL_HISTORY');
  } else if (evidence.canonicalTablePresent) {
    if (canonicalApplied !== 'APPLIED') problems.push('CANONICAL_PROVENANCE_INVALID');
    if (protectedState === 'APPLIED') problems.push('CANONICAL_ROOT_WITH_LEGACY_HISTORY');
  }
  if (!evidence.legacyTablePresent && !evidence.canonicalTablePresent) {
    if (protectedState === 'APPLIED' || canonicalApplied === 'APPLIED') {
      problems.push('APPLIED_ROOT_MISSING');
    }
  }

  return problems.sort();
}

function collectPhysicalStateProblems(
  evidence: InstitutionalPreflightEvidence,
  protectedState: 'APPLIED' | 'ABSENT' | 'PARTIAL',
  shadowPreparationApplied: 'APPLIED' | 'ABSENT' | 'INVALID',
): string[] {
  const problems: string[] = [];
  if (evidence.legacyTablePresent) {
    if (evidence.legacySingletonConstraint !== undefined
      && evidence.legacySingletonConstraint !== 'VALID') {
      problems.push('LEGACY_SINGLETON_CONSTRAINT_INVALID');
    }
    if (evidence.legacyFieldDefinitions !== undefined
      && evidence.legacyFieldDefinitions !== 'VALID') {
      problems.push('LEGACY_FIELD_DEFINITIONS_INVALID');
    }
    if (evidence.legacyRowCount !== 1)
      problems.push('LEGACY_SINGLETON_ROW_COUNT_INVALID');
    if (evidence.legacySingletonPresent !== true)
      problems.push('LEGACY_SINGLETON_ID_INVALID');
  }
  if (evidence.canonicalTablePresent) {
    if (evidence.canonicalRowCount !== 1)
      problems.push('CANONICAL_SINGLETON_ROW_COUNT_INVALID');
    if (evidence.canonicalSingletonPresent !== true)
      problems.push('CANONICAL_SINGLETON_ID_INVALID');
  }
  if (evidence.canonicalShadowDefinitions !== undefined) {
    if (shadowPreparationApplied === 'APPLIED'
      && evidence.canonicalShadowDefinitions !== 'VALID') {
      problems.push('CANONICAL_SHADOW_DEFINITIONS_INVALID');
    }
    if (shadowPreparationApplied === 'ABSENT'
      && evidence.canonicalShadowDefinitions === 'VALID') {
      problems.push('CANONICAL_SHADOWS_WITHOUT_PREPARATION_HISTORY');
    }
  }
  if (shadowPreparationApplied === 'APPLIED' && !evidence.legacyTablePresent) {
    problems.push('SHADOW_PREPARATION_WITHOUT_LEGACY_ROOT');
  }
  if (evidence.institutionalOrganizationTypeEnum !== undefined) {
    if (protectedState === 'APPLIED'
      && evidence.institutionalOrganizationTypeEnum !== 'VALID') {
      problems.push('LEGACY_ORGANIZATION_TYPE_ENUM_INVALID');
    }
    if (protectedState === 'ABSENT'
      && evidence.institutionalOrganizationTypeEnum !== 'MISSING') {
      problems.push('LEGACY_ORGANIZATION_TYPE_ENUM_WITHOUT_PROVENANCE');
    }
  }

  const boardMetadataPresent =
    evidence.boardTermCount !== null || evidence.boardAppointmentCount !== null;
  if (protectedState === 'APPLIED') {
    if (evidence.boardTermCount === null) problems.push('BOARD_TERM_TABLE_MISSING');
    if (evidence.boardAppointmentCount === null)
      problems.push('BOARD_APPOINTMENT_TABLE_MISSING');
  } else if (boardMetadataPresent) {
    problems.push('BOARD_METADATA_WITHOUT_PROVENANCE');
  }
  if (evidence.boardAppointmentCount !== null && evidence.boardTermCount === null) {
    problems.push('BOARD_APPOINTMENT_WITHOUT_BOARD_TERM');
  }
  if (evidence.boardTermCount !== null) {
    const targets = expectedBoardTermTargets(evidence);
    if (evidence.boardTermForeignKeyTarget === null) {
      problems.push('BOARD_TERM_FK_AMBIGUOUS_OR_MISSING');
    } else if (!targets.includes(evidence.boardTermForeignKeyTarget)
      || (evidence.boardTermForeignKeyTargetColumn !== undefined
        && evidence.boardTermForeignKeyTargetColumn !== 'id')) {
      problems.push('BOARD_TERM_FK_TARGET_INVALID');
    }
  }
  return problems;
}

function expectedBoardTermTargets(
  evidence: InstitutionalPreflightEvidence,
): readonly string[] {
  if (evidence.legacyTablePresent && evidence.canonicalTablePresent) {
    return ['public.InstitutionalProfile', 'public.OrganizationProfile'];
  }
  if (evidence.legacyTablePresent) return ['public.InstitutionalProfile'];
  if (evidence.canonicalTablePresent) return ['public.OrganizationProfile'];
  return [];
}

function migrationState(records: readonly MigrationRecord[]):
  | 'ABSENT'
  | 'APPLIED'
  | 'INVALID' {
  if (records.length === 0) return 'ABSENT';
  if (records.length !== 1) return 'INVALID';
  const [record] = records;
  return record.finishedAt !== null && record.rolledBackAt === null && record.appliedStepsCount > 0
    ? 'APPLIED'
    : 'INVALID';
}

function compareMappedRows(
  legacy: InstitutionalRootRow | null,
  canonical: InstitutionalRootRow | null,
): string[] {
  if (!legacy || !canonical) return [];

  const legacyValues: Record<CanonicalField, string | null> = {
    legalName: legacy.legalName,
    legalIdentification: legacy.legalIdentification,
    dinadecoRegistrationCode: legacy.dinadecoRegistrationCode,
    organizationType: mapLegacyOrganizationType(legacy.organizationType),
    region: legacy.region,
    province: legacy.province,
    canton: legacy.canton,
    district: legacy.district,
    physicalAddress: legacy.physicalAddress,
    notificationPhone: legacy.notificationPhone,
    notificationFax: legacy.notificationFax,
    notificationEmail: legacy.notificationEmail,
  };

  return CANONICAL_FIELDS.filter(
    (field) => legacyValues[field] !== null && legacyValues[field] !== canonical[field],
  );
}

function mapLegacyOrganizationType(value: string | null): string | null {
  if (value === 'INTEGRAL') return 'Asociación de Desarrollo Integral';
  if (value === 'SPECIFIC') return 'Asociación de Desarrollo Específica';
  return value;
}
