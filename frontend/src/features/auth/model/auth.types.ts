export interface AuthenticatedUser { id: number; fullName: string; email: string; status: string; role: string }
export interface LoginCredentials { email: string; password: string }
export interface LoginResponse { accessToken: string; user: AuthenticatedUser }
export interface PasswordWithConfirmation { token: string; password: string; passwordConfirmation: string }
export interface StoredSession { token: string; user: AuthenticatedUser }
export interface RegisterUser {
  fullName: string
  identificationType: 'NATIONAL' | 'DIMEX'
  identification: string
  email: string
  phoneCountryCode?: string
  phoneNationalNumber?: string
  address?: string
  password: string
}
export interface RegisteredUser {
  id: number
  fullName: string
  identificationType: 'NATIONAL' | 'DIMEX'
  identification: string
  email: string
  phoneCountryCode: string | null
  phoneNationalNumber: string | null
  phone: string | null
  address: string | null
  status: 'ACTIVE'
  lockedAt: string | null
  roleId: number
  role: { id: number; name: string; description: string | null; isActive: boolean }
  createdAt: string
  updatedAt: string
  isBlocked: boolean
  isTemporarilyLocked: boolean
  isAdministrativelyBlocked: boolean
}
