export const PREFLIGHT_STATES = Object.freeze({
  MAIN_LEGACY_ONLY: 'MAIN_LEGACY_ONLY',
  CANONICAL_ONLY: 'CANONICAL_ONLY',
  BOTH_EQUIVALENT: 'BOTH_EQUIVALENT',
  BOTH_CONFLICTING: 'BOTH_CONFLICTING',
  NEITHER: 'NEITHER',
  HISTORY_MISMATCH: 'HISTORY_MISMATCH',
});

const ORGANIZATION_TYPE_MAP = Object.freeze({
  INTEGRAL: 'Asociación de Desarrollo Integral',
  SPECIFIC: 'Asociación de Desarrollo Específica',
});

function comparable(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }
  return String(value);
}

function legacyCandidates(legacy) {
  const organizationType = comparable(legacy.organizationType);
  return {
    legalName: comparable(legacy.legalName),
    legalIdentification: comparable(legacy.legalIdentification),
    dinadecoRegistrationCode: comparable(legacy.dinadecoRegistrationCode),
    region: comparable(legacy.dinadecoRegion),
    organizationType:
      organizationType === null
        ? null
        : (ORGANIZATION_TYPE_MAP[organizationType] ?? '__UNMAPPED__'),
    province: comparable(legacy.province),
    canton: comparable(legacy.canton),
    district: comparable(legacy.district),
    physicalAddress: comparable(legacy.correspondenceAddress),
    notificationPhone: comparable(legacy.phone),
    notificationFax: comparable(legacy.telefax),
    notificationEmail: comparable(legacy.email),
  };
}

export function compareInstitutionalRoots(legacy, canonical) {
  const candidates = legacyCandidates(legacy);
  const comparedFields = [];
  const conflictingFields = [];

  for (const [field, legacyValue] of Object.entries(candidates)) {
    if (legacyValue === null) continue;

    comparedFields.push(field);
    const canonicalValue = comparable(canonical[field]);
    if (canonicalValue === null || canonicalValue !== legacyValue) {
      conflictingFields.push(field);
    }
  }

  return {
    equivalent: conflictingFields.length === 0,
    comparedFields,
    conflictingFields,
  };
}

export function classifyPreflightState({
  historySupported,
  physicalSupported,
  legacyPresent,
  canonicalPresent,
  rootsEquivalent,
}) {
  if (!historySupported || !physicalSupported) {
    return PREFLIGHT_STATES.HISTORY_MISMATCH;
  }

  if (!legacyPresent && !canonicalPresent) {
    return PREFLIGHT_STATES.NEITHER;
  }

  if (legacyPresent && !canonicalPresent) {
    return PREFLIGHT_STATES.MAIN_LEGACY_ONLY;
  }

  if (!legacyPresent && canonicalPresent) {
    return PREFLIGHT_STATES.CANONICAL_ONLY;
  }

  return rootsEquivalent
    ? PREFLIGHT_STATES.BOTH_EQUIVALENT
    : PREFLIGHT_STATES.BOTH_CONFLICTING;
}

export function buildAbortReasons({
  classification,
  multipleSingletonRows,
  invalidSingletonIdentity,
  environmentOwnershipDeclared,
  authoritativeConfigurationAvailable,
  boardForeignKeySupported,
}) {
  const reasons = [];

  if (classification === PREFLIGHT_STATES.HISTORY_MISMATCH) {
    reasons.push('UNSUPPORTED_MIGRATION_OR_PHYSICAL_STATE');
  }
  if (multipleSingletonRows) {
    reasons.push('MULTIPLE_SINGLETON_ROWS');
  }
  if (invalidSingletonIdentity) {
    reasons.push('INVALID_SINGLETON_IDENTITY');
  }
  if (classification === PREFLIGHT_STATES.BOTH_CONFLICTING) {
    reasons.push('CONFLICTING_ROOTS');
  }
  if (classification === PREFLIGHT_STATES.NEITHER) {
    reasons.push('NO_INSTITUTIONAL_ROOT');
  }
  if (!environmentOwnershipDeclared) {
    reasons.push('UNKNOWN_ENVIRONMENT_OWNERSHIP');
  }
  if (!authoritativeConfigurationAvailable) {
    reasons.push('AUTHORITATIVE_CONFIGURATION_UNAVAILABLE');
  }
  if (!boardForeignKeySupported) {
    reasons.push('BOARD_FOREIGN_KEY_UNSUPPORTED');
  }

  return [...new Set(reasons)];
}
