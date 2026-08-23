export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
export type { Role, RoleOption } from '@/features/roles'
import type { Role } from '@/features/roles'

export interface User { id: number; fullName: string; identificationType: 'NATIONAL' | 'DIMEX' | null; identification: string; email: string; phoneCountryCode: string | null; phoneNationalNumber: string | null; phone: string | null; address: string | null; status: UserStatus; lockedAt: string | null; roleId: number; role: Role; createdAt: string; updatedAt: string; isBlocked: boolean; isTemporarilyLocked: boolean; isAdministrativelyBlocked: boolean }
export interface UserUpdate { fullName?: string; email?: string; phoneCountryCode?: string; phoneNationalNumber?: string; address?: string }
export interface UserQuery { page?: number; limit?: number; name?: string; email?: string; identification?: string; status?: UserStatus; roleId?: number; blocked?: boolean }
