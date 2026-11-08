import type { IdentitySource } from './identity-reconciliation';

export function isUserReconciliationCandidate(row: {
  personId: number | null;
  fullName: string | null;
}): boolean {
  // An email-only account without Person or asserted name has no identity
  // evidence for the legacy reconciliation process.
  return row.personId !== null || hasAssertedName(row.fullName);
}

export function toSource(
  row: {
    id: number;
    identification: string | null;
    identificationType: string | null;
    fullName: string | null;
    email: string | null;
    phoneCountryCode: string | null;
    phoneNationalNumber: string | null;
    address: string | null;
  },
  sourceModel: IdentitySource['sourceModel'],
  birthDate: Date | null,
): IdentitySource {
  return {
    sourceModel,
    sourceId: row.id,
    identification: row.identification,
    identificationType: row.identificationType,
    fullName: row.fullName,
    birthDate,
    email: row.email,
    phoneCountryCode: row.phoneCountryCode,
    phoneNationalNumber: row.phoneNationalNumber,
    address: row.address,
  };
}

function hasAssertedName(fullName: string | null): boolean {
  return Boolean(fullName?.trim());
}
