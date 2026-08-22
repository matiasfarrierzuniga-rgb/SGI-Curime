export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export interface UserRole {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface User {
  id: number;
  fullName: string;
  identification: string;
  identificationType: 'NATIONAL' | 'DIMEX' | null;
  email: string;
  phoneCountryCode: string | null;
  phoneNationalNumber: string | null;
  phone: string | null;
  address: string | null;
  status: UserStatus;
  lockedAt: Date | null;
  roleId: number;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountLockState {
  isBlocked: boolean;
  isTemporarilyLocked: boolean;
  isAdministrativelyBlocked: boolean;
}
