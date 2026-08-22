export type AccountLockoutPolicy = {
  maxLoginAttempts: number;
  lockoutMinutes: number;
};

function readPositiveInteger(name: string): number {
  const rawValue = process.env[name]?.trim();
  const value = Number(rawValue);

  if (!rawValue || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be configured as a positive integer.`);
  }

  return value;
}

export function getAccountLockoutPolicy(): AccountLockoutPolicy {
  return {
    maxLoginAttempts: readPositiveInteger('MAX_LOGIN_ATTEMPTS'),
    lockoutMinutes: readPositiveInteger('ACCOUNT_LOCKOUT_MINUTES'),
  };
}

export function isTemporaryLockActive(
  lockedAt: Date | null,
  lockoutMinutes: number,
  now = new Date(),
): boolean {
  if (!lockedAt) return false;
  return lockedAt.getTime() + lockoutMinutes * 60_000 > now.getTime();
}

export function lockoutCutoff(lockoutMinutes: number, now = new Date()): Date {
  return new Date(now.getTime() - lockoutMinutes * 60_000);
}
