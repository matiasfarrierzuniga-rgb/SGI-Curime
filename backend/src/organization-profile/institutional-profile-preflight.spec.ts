import {
  HISTORICAL_CANONICAL_MIGRATION,
  CANONICAL_SHADOW_PREPARATION_MIGRATION,
  PROTECTED_MIGRATIONS,
  classifyInstitutionalPreflight,
  safeInstitutionalPreflightReport,
  type InstitutionalPreflightEvidence,
  type InstitutionalRootRow,
} from './institutional-profile-preflight';

const canonicalRow: InstitutionalRootRow = {
  id: 1,
  legalName: 'Synthetic Association',
  legalIdentification: 'SYNTHETIC-ID',
  dinadecoRegistrationCode: 'SYNTHETIC-CODE',
  organizationType: 'Asociación de Desarrollo Integral',
  region: 'Synthetic Region',
  province: 'Synthetic Province',
  canton: 'Synthetic Canton',
  district: 'Synthetic District',
  physicalAddress: 'Synthetic address',
  notificationPhone: '+506 0000 0000',
  notificationFax: null,
  notificationEmail: 'synthetic@example.test',
};

const legacyRow: InstitutionalRootRow = { ...canonicalRow, organizationType: 'INTEGRAL' };

describe('institutional profile preflight', () => {
  it('classifies MAIN_LEGACY_ONLY', () => {
    expect(classifyInstitutionalPreflight(evidence(legacyState()))).toMatchObject({
      classification: 'MAIN_LEGACY_ONLY',
    });
  });

  it('classifies CANONICAL_ONLY from historical canonical provenance', () => {
    expect(classifyInstitutionalPreflight(evidence({
      migrations: [applied(HISTORICAL_CANONICAL_MIGRATION)],
      canonicalTablePresent: true,
      canonicalRowCount: 1,
      canonicalSingletonPresent: true,
    }))).toMatchObject({ classification: 'CANONICAL_ONLY' });
  });

  it('classifies equivalent mapped roots while requiring reviewed cutover', () => {
    expect(classifyInstitutionalPreflight(evidence({
      ...dualState(),
      migrations: [...PROTECTED_MIGRATIONS.map(applied), applied(HISTORICAL_CANONICAL_MIGRATION)],
      legacyRow,
      canonicalRow,
    }))).toMatchObject({ classification: 'BOTH_EQUIVALENT', conflictingFields: [] });
  });

  it('classifies conflicting roots and reports canonical field names only', () => {
    const report = classifyInstitutionalPreflight(evidence({
      ...dualState(),
      migrations: [...PROTECTED_MIGRATIONS.map(applied), applied(HISTORICAL_CANONICAL_MIGRATION)],
      legacyRow: { ...legacyRow, legalName: 'Different synthetic value' },
      canonicalRow,
    }));

    expect(report).toMatchObject({
      classification: 'BOTH_CONFLICTING',
      conflictingFields: ['legalName'],
    });
    expect(JSON.stringify(safeInstitutionalPreflightReport(report))).not.toContain('Different synthetic value');
  });

  it('classifies NEITHER when no approved root migration was applied', () => {
    expect(classifyInstitutionalPreflight(evidence({ migrations: [] }))).toMatchObject({ classification: 'NEITHER' });
  });

  it('gives HISTORY_MISMATCH precedence over every root shape', () => {
    expect(classifyInstitutionalPreflight(evidence({
      migrationMetadataPresent: false,
      legacyTablePresent: true,
      canonicalTablePresent: true,
      legacyRow,
      canonicalRow: { ...canonicalRow, legalName: 'Different synthetic value' },
    }))).toMatchObject({
      classification: 'HISTORY_MISMATCH',
      historyProblems: ['MIGRATION_METADATA_UNAVAILABLE'],
    });
  });

  it('classifies invalid singleton physical state as HISTORY_MISMATCH', () => {
    expect(classifyInstitutionalPreflight(evidence({
      ...legacyState(),
      legacyRowCount: 2,
      legacySingletonPresent: true,
    }))).toMatchObject({
      classification: 'HISTORY_MISMATCH',
      historyProblems: ['LEGACY_SINGLETON_ROW_COUNT_INVALID'],
    });
  });

  it('classifies missing or wrong singleton constraint as HISTORY_MISMATCH', () => {
    for (const legacySingletonConstraint of ['MISSING', 'INVALID'] as const) {
      expect(classifyInstitutionalPreflight(evidence({
        ...legacyState(), legacySingletonConstraint,
      }))).toMatchObject({
        classification: 'HISTORY_MISMATCH',
        historyProblems: ['LEGACY_SINGLETON_CONSTRAINT_INVALID'],
      });
    }
  });

  it('classifies legacy type or nullability metadata mismatch as HISTORY_MISMATCH', () => {
    expect(classifyInstitutionalPreflight(evidence({
      ...legacyState(), legacyFieldDefinitions: 'INVALID',
    }))).toMatchObject({
      classification: 'HISTORY_MISMATCH',
      historyProblems: ['LEGACY_FIELD_DEFINITIONS_INVALID'],
    });
  });

  it('classifies a root without singleton id 1 as HISTORY_MISMATCH', () => {
    expect(classifyInstitutionalPreflight(evidence({
      ...legacyState(),
      legacySingletonPresent: false,
    }))).toMatchObject({
      classification: 'HISTORY_MISMATCH',
      historyProblems: ['LEGACY_SINGLETON_ID_INVALID'],
    });
  });

  it('classifies duplicate protected migration provenance as HISTORY_MISMATCH', () => {
    expect(classifyInstitutionalPreflight(evidence({
      ...legacyState(),
      migrations: [
        applied(PROTECTED_MIGRATIONS[0]),
        applied(PROTECTED_MIGRATIONS[0]),
        applied(PROTECTED_MIGRATIONS[1]),
      ],
    }))).toMatchObject({
      classification: 'HISTORY_MISMATCH',
      historyProblems: expect.arrayContaining(['PROTECTED_MIGRATION_INVALID']),
    });
  });

  it('classifies BoardTerm FK ambiguity as structural HISTORY_MISMATCH', () => {
    expect(classifyInstitutionalPreflight(evidence({
      legacyTablePresent: true,
      legacyRowCount: 1,
      legacySingletonPresent: true,
      boardTermCount: 0,
      boardAppointmentCount: 0,
      boardTermForeignKeyTarget: null,
    }))).toMatchObject({
      classification: 'HISTORY_MISMATCH',
      historyProblems: ['BOARD_TERM_FK_AMBIGUOUS_OR_MISSING'],
    });
  });

  it('classifies a BoardTerm FK target column mismatch as HISTORY_MISMATCH', () => {
    expect(classifyInstitutionalPreflight(evidence({
      ...legacyState(), boardTermForeignKeyTargetColumn: 'legacyId',
    }))).toMatchObject({
      classification: 'HISTORY_MISMATCH',
      historyProblems: ['BOARD_TERM_FK_TARGET_INVALID'],
    });
  });

  it('requires expected legacy enum metadata and rejects enum without provenance', () => {
    expect(classifyInstitutionalPreflight(evidence({
      ...legacyState(), institutionalOrganizationTypeEnum: 'MISSING',
    }))).toMatchObject({
      classification: 'HISTORY_MISMATCH',
      historyProblems: ['LEGACY_ORGANIZATION_TYPE_ENUM_INVALID'],
    });
    expect(classifyInstitutionalPreflight(evidence({
      migrations: [], institutionalOrganizationTypeEnum: 'VALID',
    }))).toMatchObject({
      classification: 'HISTORY_MISMATCH',
      historyProblems: ['LEGACY_ORGANIZATION_TYPE_ENUM_WITHOUT_PROVENANCE'],
    });
  });

  it('accepts prepared canonical shadows only with preparation provenance', () => {
    expect(classifyInstitutionalPreflight(evidence({
      ...legacyState(),
      migrations: [...PROTECTED_MIGRATIONS.map(applied), applied(CANONICAL_SHADOW_PREPARATION_MIGRATION)],
      canonicalShadowDefinitions: 'VALID',
    }))).toMatchObject({ classification: 'MAIN_LEGACY_ONLY' });
  });

  it('rejects missing prepared shadows and unexpected branch-only shadow artifacts', () => {
    expect(classifyInstitutionalPreflight(evidence({
      ...legacyState(),
      migrations: [...PROTECTED_MIGRATIONS.map(applied), applied(CANONICAL_SHADOW_PREPARATION_MIGRATION)],
      canonicalShadowDefinitions: 'MISSING',
    }))).toMatchObject({
      classification: 'HISTORY_MISMATCH',
      historyProblems: ['CANONICAL_SHADOW_DEFINITIONS_INVALID'],
    });
    expect(classifyInstitutionalPreflight(evidence({
      ...legacyState(), canonicalShadowDefinitions: 'VALID',
    }))).toMatchObject({
      classification: 'HISTORY_MISMATCH',
      historyProblems: ['CANONICAL_SHADOWS_WITHOUT_PREPARATION_HISTORY'],
    });
  });

  it('rejects unexpected canonical table or shadow preparation provenance', () => {
    expect(classifyInstitutionalPreflight(evidence({
      ...legacyState(), canonicalTablePresent: true, canonicalRowCount: 1, canonicalSingletonPresent: true,
    }))).toMatchObject({
      classification: 'HISTORY_MISMATCH',
      historyProblems: ['CANONICAL_PROVENANCE_INVALID'],
    });
    expect(classifyInstitutionalPreflight(evidence({
      migrations: [applied(CANONICAL_SHADOW_PREPARATION_MIGRATION)],
      canonicalShadowDefinitions: 'MISSING',
    }))).toMatchObject({
      classification: 'HISTORY_MISMATCH',
      historyProblems: expect.arrayContaining(['SHADOW_PREPARATION_WITHOUT_LEGACY_ROOT']),
    });
  });

  it('keeps behind-main NEITHER when absent physical metadata matches absent provenance', () => {
    expect(classifyInstitutionalPreflight(evidence({
      migrations: [], institutionalOrganizationTypeEnum: 'MISSING',
    }))).toMatchObject({ classification: 'NEITHER', historyProblems: [] });
  });

  it('sanitizes diagnostics to structural facts and field names', () => {
    const report = classifyInstitutionalPreflight(evidence({
      ...dualState(),
      migrations: [...PROTECTED_MIGRATIONS.map(applied), applied(HISTORICAL_CANONICAL_MIGRATION)],
      legacyRow: { ...legacyRow, notificationEmail: 'private-legacy@example.test' },
      canonicalRow: { ...canonicalRow, notificationEmail: 'private-canonical@example.test' },
    }));

    expect(safeInstitutionalPreflightReport(report)).toEqual(expect.objectContaining({
      classification: 'BOTH_CONFLICTING',
      conflictingFields: ['notificationEmail'],
    }));
    const output = JSON.stringify(safeInstitutionalPreflightReport(report));
    expect(output).not.toContain('private-legacy@example.test');
    expect(output).not.toContain('private-canonical@example.test');
    expect(output).toContain('legacySingletonConstraint');
  });
});

function evidence(
  overrides: Partial<InstitutionalPreflightEvidence> = {},
): InstitutionalPreflightEvidence {
  return {
    migrationMetadataPresent: true,
    migrations: PROTECTED_MIGRATIONS.map(applied),
    legacyTablePresent: false,
    canonicalTablePresent: false,
    legacyRowCount: null,
    legacySingletonPresent: null,
    canonicalRowCount: null,
    canonicalSingletonPresent: null,
    legacyRow: null,
    canonicalRow: null,
    boardTermCount: null,
    boardAppointmentCount: null,
    boardTermForeignKeyTarget: null,
    ...overrides,
  };
}

function applied(migrationName: string) {
  return {
    migrationName,
    finishedAt: new Date('2026-01-01T00:00:00.000Z'),
    rolledBackAt: null,
    appliedStepsCount: 1,
  };
}

function legacyState(): Partial<InstitutionalPreflightEvidence> {
  return {
    legacyTablePresent: true,
    legacyRowCount: 1,
    legacySingletonPresent: true,
    boardTermCount: 0,
    boardAppointmentCount: 0,
    boardTermForeignKeyTarget: 'public.InstitutionalProfile',
    boardTermForeignKeyTargetColumn: 'id',
    legacySingletonConstraint: 'VALID',
    legacyFieldDefinitions: 'VALID',
    canonicalShadowDefinitions: 'MISSING',
    institutionalOrganizationTypeEnum: 'VALID',
  };
}

function dualState(): Partial<InstitutionalPreflightEvidence> {
  return {
    ...legacyState(),
    canonicalTablePresent: true,
    canonicalRowCount: 1,
    canonicalSingletonPresent: true,
  };
}
