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

export interface UserPersonContext {
  id: string;
  contactEmail: string | null;
}

export interface UserAffiliateContext {
  id: string;
  status: 'ACTIVE' | 'INACTIVE';
  legacyRoleId: number | null;
}

export interface AdminPersonReadModel {
  id: string;
  fullName: string | null;
  identification: string | null;
  identificationType: 'NATIONAL' | 'DIMEX' | null;
  contactEmail: string | null;
  phoneCountryCode: string | null;
  phoneNationalNumber: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
  access: User | null;
  affiliate: UserAffiliateContext | null;
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
  subscriptionExpirationDate: Date | null;
  lockedAt: Date | null;
  roleId: number;
  role: UserRole;
  personId: string | null;
  affiliateId: string | null;
  person: UserPersonContext | null;
  affiliate: UserAffiliateContext | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountLockState {
  isBlocked: boolean;
  isTemporarilyLocked: boolean;
  isAdministrativelyBlocked: boolean;
}
