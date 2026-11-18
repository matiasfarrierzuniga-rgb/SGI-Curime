/**
 * Presentation-only account name. It never derives an account name from a
 * linked Person, preserving the separation between account and institutional
 * identity for historical records.
 */
export function formatAccountDisplayName(account: {
  displayName?: string | null;
  fullName?: string | null;
}): string {
  return normalizedName(account.displayName) ?? normalizedName(account.fullName) ?? 'Cuenta';
}

export function accountDisplayNameProjection<
  T extends { displayName?: string | null; fullName?: string | null },
>(account: T): Omit<T, 'displayName' | 'fullName'> & { displayName: string } {
  const { displayName: _displayName, fullName: _fullName, ...rest } = account;
  return { ...rest, displayName: formatAccountDisplayName(account) };
}

function normalizedName(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}
