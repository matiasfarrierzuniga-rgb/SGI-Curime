import { createHash } from 'node:crypto';
import {
  normalizeIdentification,
  sourceFingerprint,
  type IdentitySource,
} from './identity-reconciliation';

export const MANUAL_RECONCILIATION_REVIEWER =
  'IDENTITY-6.6_MANUAL_RECONCILIATION';

export interface ManualReconciliationInput {
  userId: number;
  identificationType: 'NATIONAL';
  firstName: string;
  firstSurname: string;
  secondSurname: string;
  apply: boolean;
  confirmUserId: number | null;
  expectedSourceFingerprint: string | null;
  expectedConfirmationFingerprint: string | null;
}

export interface ManualLegacyUser extends IdentitySource {
  sourceModel: 'User';
  personId: number | null;
}

export interface ManualPersonCandidate {
  id: number;
  identification: string | null;
  identificationType: string | null;
  normalizedIdentification: string | null;
  firstName: string | null;
  firstSurname: string | null;
  secondSurname: string | null;
  linkedUserId: number | null;
}

export type ManualReconciliationStatus =
  'READY_TO_CREATE' | 'READY_TO_REUSE' | 'ALREADY_RECONCILED' | 'BLOCKED';

export interface ManualReconciliationPlan {
  status: ManualReconciliationStatus;
  sourceFingerprint: string | null;
  confirmationFingerprint: string | null;
  normalizedIdentification: string | null;
  matchingPersonCount: number;
  selectedPersonId: number | null;
  personCreationRequired: boolean;
  compatiblePersonFound: boolean;
  conflictFound: boolean;
  applySafe: boolean;
  writeRequired: boolean;
  reason: string | null;
}

export function parseManualReconciliationArgs(
  args: readonly string[],
): ManualReconciliationInput {
  const values = new Map<string, string>();
  let apply = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--apply') {
      apply = true;
      continue;
    }
    if (!argument.startsWith('--'))
      throw new Error(`Unexpected argument: ${argument}`);
    const separator = argument.indexOf('=');
    const key =
      separator >= 0 ? argument.slice(2, separator) : argument.slice(2);
    const inlineValue = separator >= 0 ? argument.slice(separator + 1) : null;
    const nextValue = inlineValue ?? args[index + 1];
    if (!nextValue || nextValue.startsWith('--')) {
      throw new Error(`Missing value for --${key}.`);
    }
    values.set(key, nextValue);
    if (inlineValue === null) index += 1;
  }

  const userId = positiveInteger(values.get('user-id'), '--user-id');
  const identificationType = requiredValue(
    values.get('identification-type') ??
      process.env.MANUAL_IDENTITY_IDENTIFICATION_TYPE,
    '--identification-type',
  );
  if (identificationType !== 'NATIONAL') {
    throw new Error(
      'Only human-confirmed NATIONAL identification is supported.',
    );
  }
  const confirmUserId = optionalPositiveInteger(
    values.get('confirm-user-id'),
    '--confirm-user-id',
  );
  const expectedSourceFingerprint =
    values.get('source-fingerprint')?.trim() || null;
  const expectedConfirmationFingerprint =
    values.get('confirmation-fingerprint')?.trim() || null;
  if (apply && confirmUserId !== userId) {
    throw new Error('--confirm-user-id must equal --user-id for apply.');
  }
  if (apply && !expectedSourceFingerprint) {
    throw new Error('--source-fingerprint is required for apply.');
  }
  if (apply && !expectedConfirmationFingerprint) {
    throw new Error('--confirmation-fingerprint is required for apply.');
  }

  return {
    userId,
    identificationType,
    firstName: requiredValue(
      values.get('first-name') ?? process.env.MANUAL_IDENTITY_FIRST_NAME,
      '--first-name',
    ),
    firstSurname: requiredValue(
      values.get('first-surname') ?? process.env.MANUAL_IDENTITY_FIRST_SURNAME,
      '--first-surname',
    ),
    secondSurname: requiredValue(
      values.get('second-surname') ??
        process.env.MANUAL_IDENTITY_SECOND_SURNAME,
      '--second-surname',
    ),
    apply,
    confirmUserId,
    expectedSourceFingerprint,
    expectedConfirmationFingerprint,
  };
}

export function buildManualReconciliationPlan(
  user: ManualLegacyUser | null,
  people: readonly ManualPersonCandidate[],
  input: ManualReconciliationInput,
): ManualReconciliationPlan {
  if (!user) return blocked('TARGET_USER_NOT_FOUND');
  const fingerprint = sourceFingerprint(user);
  const confirmationFingerprint = manualConfirmationFingerprint(
    fingerprint,
    input,
  );
  if (!user.identification?.trim()) {
    return blocked(
      'IDENTIFICATION_MISSING',
      fingerprint,
      confirmationFingerprint,
    );
  }
  const identity = normalizeIdentification(
    input.identificationType,
    user.identification,
  );
  if (!identity)
    return blocked(
      'NORMALIZATION_INVALID',
      fingerprint,
      confirmationFingerprint,
    );

  const matchingPeople = people.filter(
    (person) =>
      person.identificationType === identity.identificationType &&
      person.normalizedIdentification === identity.normalizedIdentification,
  );
  if (
    people.some(
      (person) =>
        person.identification?.trim() === identity.rawIdentification &&
        !matchingPeople.some((match) => match.id === person.id),
    )
  ) {
    return blocked(
      'RAW_IDENTIFICATION_PERSON_CONFLICT',
      fingerprint,
      confirmationFingerprint,
      identity.normalizedIdentification,
      matchingPeople.length,
    );
  }
  const linkedPerson =
    user.personId === null
      ? null
      : (people.find((person) => person.id === user.personId) ?? null);
  if (matchingPeople.length > 1) {
    return blocked(
      'MULTIPLE_PERSON_MATCHES',
      fingerprint,
      confirmationFingerprint,
      identity.normalizedIdentification,
      matchingPeople.length,
    );
  }
  if (user.personId !== null && !linkedPerson) {
    return blocked(
      'LINKED_PERSON_INCOMPATIBLE',
      fingerprint,
      confirmationFingerprint,
      identity.normalizedIdentification,
      matchingPeople.length,
    );
  }

  const selectedPerson = matchingPeople[0] ?? null;
  if (selectedPerson && !isCompatiblePerson(selectedPerson, input)) {
    return blocked(
      'PERSON_STRUCTURED_IDENTITY_CONFLICT',
      fingerprint,
      confirmationFingerprint,
      identity.normalizedIdentification,
      matchingPeople.length,
    );
  }
  if (
    selectedPerson?.linkedUserId !== null &&
    selectedPerson?.linkedUserId !== undefined &&
    selectedPerson.linkedUserId !== user.sourceId
  ) {
    return blocked(
      'PERSON_ALREADY_OWNED_BY_ANOTHER_USER',
      fingerprint,
      confirmationFingerprint,
      identity.normalizedIdentification,
      matchingPeople.length,
    );
  }
  if (user.personId !== null) {
    if (selectedPerson?.id !== user.personId) {
      return blocked(
        'USER_LINK_CONFLICT',
        fingerprint,
        confirmationFingerprint,
        identity.normalizedIdentification,
        matchingPeople.length,
      );
    }
    return {
      status: 'ALREADY_RECONCILED',
      sourceFingerprint: fingerprint,
      confirmationFingerprint: manualConfirmationFingerprint(
        fingerprint,
        input,
        {
          status: 'ALREADY_RECONCILED',
          selectedPersonId: selectedPerson.id,
          matchingPersonCount: 1,
          personCreationRequired: false,
        },
      ),
      normalizedIdentification: identity.normalizedIdentification,
      matchingPersonCount: 1,
      selectedPersonId: selectedPerson.id,
      personCreationRequired: false,
      compatiblePersonFound: true,
      conflictFound: false,
      applySafe: true,
      writeRequired: false,
      reason: null,
    };
  }

  return {
    status: selectedPerson ? 'READY_TO_REUSE' : 'READY_TO_CREATE',
    sourceFingerprint: fingerprint,
    confirmationFingerprint: manualConfirmationFingerprint(fingerprint, input, {
      status: selectedPerson ? 'READY_TO_REUSE' : 'READY_TO_CREATE',
      selectedPersonId: selectedPerson?.id ?? null,
      matchingPersonCount: matchingPeople.length,
      personCreationRequired: selectedPerson === null,
    }),
    normalizedIdentification: identity.normalizedIdentification,
    matchingPersonCount: matchingPeople.length,
    selectedPersonId: selectedPerson?.id ?? null,
    personCreationRequired: selectedPerson === null,
    compatiblePersonFound: selectedPerson !== null,
    conflictFound: false,
    applySafe: true,
    writeRequired: true,
    reason: null,
  };
}

export function isCurrentSourceFingerprint(
  plan: ManualReconciliationPlan,
  expectedFingerprint: string | null,
): boolean {
  return (
    plan.sourceFingerprint !== null &&
    plan.sourceFingerprint === expectedFingerprint
  );
}

export function isCurrentConfirmationFingerprint(
  plan: ManualReconciliationPlan,
  expectedFingerprint: string | null,
): boolean {
  return (
    plan.confirmationFingerprint !== null &&
    plan.confirmationFingerprint === expectedFingerprint
  );
}

export function safeManualPlanReport(
  plan: ManualReconciliationPlan,
): Record<string, string | number> {
  return {
    MATCHING_PERSON_COUNT: plan.matchingPersonCount,
    COMPATIBLE_PERSON_FOUND: plan.compatiblePersonFound ? 'YES' : 'NO',
    PERSON_CREATION_REQUIRED: plan.personCreationRequired ? 'YES' : 'NO',
    CONFLICT_FOUND: plan.conflictFound ? 'YES' : 'NO',
    SOURCE_FINGERPRINT: plan.sourceFingerprint ?? 'NONE',
    CONFIRMATION_FINGERPRINT: plan.confirmationFingerprint ?? 'NONE',
    APPLY_SAFE: plan.applySafe ? 'YES' : 'NO',
    STATUS: plan.status,
    REASON: plan.reason ?? 'NONE',
  };
}

function isCompatiblePerson(
  person: ManualPersonCandidate,
  input: ManualReconciliationInput,
): boolean {
  return (
    compatibleName(person.firstName, input.firstName) &&
    compatibleName(person.firstSurname, input.firstSurname) &&
    compatibleName(person.secondSurname, input.secondSurname)
  );
}

function compatibleName(existing: string | null, confirmed: string): boolean {
  return (
    existing === null || normalizeName(existing) === normalizeName(confirmed)
  );
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-CR');
}

function blocked(
  reason: string,
  fingerprint: string | null = null,
  confirmationFingerprint: string | null = null,
  normalizedIdentification: string | null = null,
  matchingPersonCount = 0,
): ManualReconciliationPlan {
  return {
    status: 'BLOCKED',
    sourceFingerprint: fingerprint,
    confirmationFingerprint,
    normalizedIdentification,
    matchingPersonCount,
    selectedPersonId: null,
    personCreationRequired: false,
    compatiblePersonFound: false,
    conflictFound: true,
    applySafe: false,
    writeRequired: false,
    reason,
  };
}

function manualConfirmationFingerprint(
  fingerprint: string,
  input: ManualReconciliationInput,
  decision: {
    status: ManualReconciliationStatus;
    selectedPersonId: number | null;
    matchingPersonCount: number;
    personCreationRequired: boolean;
  } | null = null,
): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        sourceFingerprint: fingerprint,
        identificationType: input.identificationType,
        firstName: input.firstName,
        firstSurname: input.firstSurname,
        secondSurname: input.secondSurname,
        decision,
      }),
    )
    .digest('hex');
}

function requiredValue(value: string | undefined, option: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${option} is required.`);
  return normalized;
}

function positiveInteger(value: string | undefined, option: string): number {
  const parsed = Number(value);
  if (!value || !Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${option} must be a positive integer.`);
  }
  return parsed;
}

function optionalPositiveInteger(
  value: string | undefined,
  option: string,
): number | null {
  return value === undefined ? null : positiveInteger(value, option);
}
