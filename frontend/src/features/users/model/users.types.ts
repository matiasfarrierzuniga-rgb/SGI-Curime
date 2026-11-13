export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_EMAIL_VERIFICATION' | 'BLOCKED'
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
  linkPerson: boolean
}

/** GET /users/accounts response. Root id identifies User account; person is optional. */
export interface User {
  id: string
  fullName: string | null
  identificationType: 'NATIONAL' | 'DIMEX' | null
  identification: string | null
  phoneCountryCode: string | null
  phoneNationalNumber: string | null
  address: string | null
  personId: string | null
  affiliateId: string | null
  createdAt: string
  updatedAt: string
  person: { id: string; contactEmail: string | null } | null
  access: AccountAccess | null
  affiliate: AffiliateContext | null
  actions: UserActions
  effectiveCapabilities?: string[]
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

export interface UserUpdate { email: string }
export interface UserQuery { page?: number; limit?: number; name?: string; email?: string; identification?: string; status?: UserStatus; roleId?: number; blocked?: boolean }

export interface PersonLinkCandidate {
  id: number
  displayName: string
  identificationHint: string | null
  affiliateStatus: 'ACTIVE' | 'INACTIVE' | null
}

export interface AccountPersonLinkInput {
  userId: number
  personId: number
  verificationMethod: 'ADMINISTRATIVE_REVIEW'
  evidenceReference: string
  reason: string
}

export interface CreatePersonInput {
  identificationType: 'NATIONAL' | 'DIMEX'
  identification: string
  firstName: string
  firstSurname: string
  secondSurname?: string
  phoneCountryCode?: string
  phoneNationalNumber?: string
  address?: string
  reason: string
}

export interface CreatePersonResult {
  personId: number
  created: boolean
  person: {
    id: number
    firstName: string | null
    firstSurname: string | null
    secondSurname: string | null
    identification: string | null
    identificationType: 'NATIONAL' | 'DIMEX' | null
  }
}
