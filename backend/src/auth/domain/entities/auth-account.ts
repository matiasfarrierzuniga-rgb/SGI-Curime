export interface AuthAccount {
  id: number;
  email: string;
  fullName: string;
  status: string;
  passwordHash: string | null;
  lockedAt: Date | null;
  failedLoginAttempts: number;
  lastLoginAt: Date | null;
  roleName: string;
  subscriptionExpirationDate: Date | null;
}

export interface ActivationToken {
  id: number;
  userId: number;
  usedAt: Date | null;
  expiresAt: Date;
  userStatus: string;
}

export interface ResetToken {
  id: number;
  userId: number;
  usedAt: Date | null;
  expiresAt: Date;
}
