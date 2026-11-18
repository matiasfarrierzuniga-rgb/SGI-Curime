/**
 * Presentation-only institutional name. It is derived exclusively from the
 * canonical atomic Person fields; legacy snapshots are intentionally ignored.
 */
export function formatInstitutionalPersonName(person: {
  firstName?: string | null;
  firstSurname?: string | null;
  secondSurname?: string | null;
}): string | null {
  const name = [person.firstName, person.firstSurname, person.secondSurname]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(' ');

  return name || null;
}
