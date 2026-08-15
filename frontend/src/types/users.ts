export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
export interface RoleOption { id: number; name: string }
export interface Role { id: number; name: string; description: string | null; isActive: boolean }
export interface User { id: number; fullName: string; identification: string; email: string; phone: string | null; address: string | null; status: UserStatus; lockedAt: string | null; roleId: number; role: Role; createdAt: string; updatedAt: string; isBlocked: boolean; isTemporarilyLocked: boolean; isAdministrativelyBlocked: boolean }
export interface UserUpdate { fullName?: string; email?: string; phone?: string; address?: string }
export interface UserQuery { page?: number; limit?: number; name?: string; email?: string; identification?: string; status?: UserStatus; roleId?: number; blocked?: boolean }
