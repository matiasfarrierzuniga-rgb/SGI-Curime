export interface AuthenticatedUser {
  id: number; fullName: string; email: string; status: string; role: string
  identification?: string
  identificationType?: 'NATIONAL' | 'DIMEX' | null
  address?: string | null
  phoneCountryCode?: string | null
  phoneNationalNumber?: string | null
  personId?: string | null
  affiliateId?: string | null
  affiliateStatus?: 'ACTIVE' | 'INACTIVE' | null
  affiliateRoleId?: number | null
  affiliateRequestStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  canAccessErp: boolean
  permissionCodes: string[]
}
export interface LoginCredentials { email: string; password: string }
export interface LoginResponse { accessToken: string; user: AuthenticatedUser }
export interface PasswordWithConfirmation { token: string; password: string; passwordConfirmation: string }
export interface StoredSession { token: string; user: AuthenticatedUser }
