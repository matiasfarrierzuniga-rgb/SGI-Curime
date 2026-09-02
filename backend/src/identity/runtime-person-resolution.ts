import { FULL_NAME_PATTERN } from '../common/validation/identity-contact.validation';
import { normalizeIdentification } from '../identity-reconciliation/identity-reconciliation';

export const RUNTIME_IDENTITY_NORMALIZATION_VERSION = 'v1';

export interface RuntimePersonIdentityInput {
  identificationType?: string | null;
  identification?: string | null;
  firstName?: string | null;
  firstSurname?: string | null;
  secondSurname?: string | null;
}

export interface PreparedRuntimePersonIdentity {
  identificationType: 'NATIONAL' | 'DIMEX';
  identification: string;
  normalizedIdentification: string;
  firstName: string;
  firstSurname: string;
  secondSurname: string | null;
}

export interface RuntimePersonRecord {
  id: number;
  firstName: string | null;
  firstSurname: string | null;
  secondSurname: string | null;
  identification: string | null;
  identificationType: string | null;
  normalizedIdentification: string | null;
}

export type RuntimeIdentityValidationResult =
  | { status: 'VALID'; identity: PreparedRuntimePersonIdentity }
  | {
      status: 'IDENTITY_INCOMPLETE';
      missingFields: Array<
        'identificationType' | 'identification' | 'firstName' | 'firstSurname'
      >;
    }
  | {
      status: 'INVALID_IDENTIFICATION';
      reason: 'UNSUPPORTED_IDENTIFICATION_TYPE' | 'INVALID_IDENTIFICATION';
    }
  | {
      status: 'INVALID_STRUCTURED_NAME';
      invalidFields: Array<'firstName' | 'firstSurname' | 'secondSurname'>;
    };

export type PersonCompatibilityResult =
  | { status: 'COMPATIBLE'; profileEnrichmentRequired: boolean }
  | {
      status: 'IDENTITY_CONFLICT';
      conflictFields: Array<'firstName' | 'firstSurname' | 'secondSurname'>;
    };

export type RuntimePersonResolutionResult =
  | {
      status: 'PERSON_CREATED' | 'PERSON_REUSED';
      person: RuntimePersonRecord;
      profileEnrichmentRequired: boolean;
    }
  | Exclude<RuntimeIdentityValidationResult, { status: 'VALID' }>
  | Extract<PersonCompatibilityResult, { status: 'IDENTITY_CONFLICT' }>
  | {
      status: 'IDENTITY_DUPLICATE_CORRUPTION';
      matchingPersonCount: number;
    }
  | { status: 'MANUAL_REVIEW_REQUIRED'; reason: string };

export function prepareRuntimePersonIdentity(
  input: RuntimePersonIdentityInput,
): RuntimeIdentityValidationResult {
  const identificationType = input.identificationType?.trim() ?? '';
  const identification = input.identification?.trim() ?? '';
  const firstName = input.firstName?.trim() ?? '';
  const firstSurname = input.firstSurname?.trim() ?? '';
  const secondSurname = input.secondSurname?.trim() || null;
  const missingFields: Extract<
    RuntimeIdentityValidationResult,
    { status: 'IDENTITY_INCOMPLETE' }
  >['missingFields'] = [];

  if (!identificationType) missingFields.push('identificationType');
  if (!identification) missingFields.push('identification');
  if (!firstName) missingFields.push('firstName');
  if (!firstSurname) missingFields.push('firstSurname');
  if (missingFields.length > 0) {
    return { status: 'IDENTITY_INCOMPLETE', missingFields };
  }

  if (identificationType !== 'NATIONAL' && identificationType !== 'DIMEX') {
    return {
      status: 'INVALID_IDENTIFICATION',
      reason: 'UNSUPPORTED_IDENTIFICATION_TYPE',
    };
  }
  const normalized = normalizeIdentification(
    identificationType,
    identification,
  );
  if (!normalized) {
    return {
      status: 'INVALID_IDENTIFICATION',
      reason: 'INVALID_IDENTIFICATION',
    };
  }

  const invalidFields: Extract<
    RuntimeIdentityValidationResult,
    { status: 'INVALID_STRUCTURED_NAME' }
  >['invalidFields'] = [];
  if (!isValidNameComponent(firstName)) invalidFields.push('firstName');
  if (!isValidNameComponent(firstSurname)) invalidFields.push('firstSurname');
  if (secondSurname && !isValidNameComponent(secondSurname)) {
    invalidFields.push('secondSurname');
  }
  if (invalidFields.length > 0) {
    return { status: 'INVALID_STRUCTURED_NAME', invalidFields };
  }

  return {
    status: 'VALID',
    identity: {
      identificationType: normalized.identificationType,
      identification: normalized.rawIdentification,
      normalizedIdentification: normalized.normalizedIdentification,
      firstName,
      firstSurname,
      secondSurname,
    },
  };
}

export function evaluatePersonCompatibility(
  person: RuntimePersonRecord,
  input: PreparedRuntimePersonIdentity,
): PersonCompatibilityResult {
  const conflictFields: Extract<
    PersonCompatibilityResult,
    { status: 'IDENTITY_CONFLICT' }
  >['conflictFields'] = [];

  if (conflicts(person.firstName, input.firstName)) {
    conflictFields.push('firstName');
  }
  if (conflicts(person.firstSurname, input.firstSurname)) {
    conflictFields.push('firstSurname');
  }
  if (
    input.secondSurname !== null &&
    conflicts(person.secondSurname, input.secondSurname)
  ) {
    conflictFields.push('secondSurname');
  }
  if (conflictFields.length > 0) {
    return { status: 'IDENTITY_CONFLICT', conflictFields };
  }

  return {
    status: 'COMPATIBLE',
    profileEnrichmentRequired:
      person.firstName === null ||
      person.firstSurname === null ||
      (input.secondSurname !== null && person.secondSurname === null),
  };
}

function isValidNameComponent(value: string): boolean {
  return value.length <= 150 && FULL_NAME_PATTERN.test(value);
}

function conflicts(existing: string | null, input: string): boolean {
  return existing !== null && normalizeName(existing) !== normalizeName(input);
}

function normalizeName(value: string): string {
  return value
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es-CR');
}
