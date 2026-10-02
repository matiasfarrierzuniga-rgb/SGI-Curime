export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
export type { Role, RoleOption } from '@/features/roles'
import type { Role } from '@/features/roles'

export interface AccountAccess {
  id: number
  email: string
  status: UserStatus
  subscriptionExpirationDate: string | null
  lockedAt: string | null
  roleId: number
  role: Role
  personId: string | null
  isBlocked: boolean
  isTemporarilyLocked: boolean
  isAdministrativelyBlocked: boolean
}

export interface AffiliateContext {
  id: string
  status: 'ACTIVE' | 'INACTIVE'
  legacyRoleId: number | null
}

export interface UserActions {
  read: boolean
  update: boolean
  changeRole: boolean
  manageLifecycle: boolean
  unlock: boolean
}

/** GET /users response. Root id/personId identify Person, never User account. */
export interface User {
  id: string
  fullName: string | null
  identificationType: 'NATIONAL' | 'DIMEX' | null
  identification: string | null
  phoneCountryCode: string | null
  phoneNationalNumber: string | null
  address: string | null
  personId: string
  affiliateId: string | null
  createdAt: string
  updatedAt: string
  person: { id: string; contactEmail: string | null }
  access: AccountAccess | null
  affiliate: AffiliateContext | null
  actions: UserActions
}

/** PATCH /users/:accessId returns an account-root response, not a Person-root User. */
export interface AccountMutationResponse {
  id: number
  fullName: string
  identification: string
  identificationType: 'NATIONAL' | 'DIMEX' | null
  email: string
  phoneCountryCode: string | null
  phoneNationalNumber: string | null
  phone: string | null
  address: string | null
  status: UserStatus
  subscriptionExpirationDate: string | null
  lockedAt: string | null
  roleId: number
  role: Role
  personId: string | null
  affiliateId: string | null
  person: { id: string; contactEmail: string | null } | null
  affiliate: AffiliateContext | null
  createdAt: string
  updatedAt: string
  isBlocked: boolean
  isTemporarilyLocked: boolean
  isAdministrativelyBlocked: boolean
}

export interface UserUpdate { fullName?: string; email?: string; phoneCountryCode?: string; phoneNationalNumber?: string; address?: string }
export interface UserQuery { page?: number; limit?: number; name?: string; email?: string; identification?: string; status?: UserStatus; roleId?: number; blocked?: boolean }
