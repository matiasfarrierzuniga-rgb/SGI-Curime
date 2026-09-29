export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
export type { Role, RoleOption } from '@/features/roles'
import type { Role } from '@/features/roles'

export interface AccountAccess {
  id: number
  email: string
  status: UserStatus
  lockedAt: string | null
  roleId: number
  role: Role
  isBlocked: boolean
  isTemporarilyLocked: boolean
  isAdministrativelyBlocked: boolean
}

export interface AffiliateContext {
  id: number
  status: 'ACTIVE' | 'INACTIVE'
  legacyRoleId: number | null
}

/** GET /users response. Root id/personId identify Person, never User account. */
export interface User {
  id: number
  fullName: string | null
  identificationType: 'NATIONAL' | 'DIMEX' | null
  identification: string | null
  phoneCountryCode: string | null
  phoneNationalNumber: string | null
  address: string | null
  personId: number
  affiliateId: number | null
  createdAt: string
  updatedAt: string
  person: { id: number; contactEmail: string | null }
  access: AccountAccess | null
  affiliate: AffiliateContext | null
  actions: { read: boolean }
}

/** PATCH /users/:accessId remains an account (User) mutation contract. */
export interface UserUpdate { fullName?: string; email?: string; phoneCountryCode?: string; phoneNationalNumber?: string; address?: string }
export interface UserQuery { page?: number; limit?: number; name?: string; email?: string; identification?: string; status?: UserStatus; roleId?: number; blocked?: boolean }
