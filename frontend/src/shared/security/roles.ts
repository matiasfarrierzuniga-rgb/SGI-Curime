import { hasManagementCapabilities } from './access'
import { ROLE_NAMES } from './roleNames'

export { LEGACY_ROLE_NAMES, ROLE_NAMES, type RoleName } from './roleNames'

export const ROLE_ADMIN = ROLE_NAMES.ADMIN
export const ROLE_INVENTORY_MANAGER = ROLE_NAMES.INVENTORY_MANAGER

export const ADMIN_ROLES: readonly string[] = [ROLE_ADMIN]
export const INVENTORY_ROLES: readonly string[] = [ROLE_ADMIN, ROLE_INVENTORY_MANAGER]

export function isAdmin(role: string | null | undefined): boolean {
  return role === ROLE_ADMIN
}

export function canManageInventory(role: string | null | undefined): boolean {
  return role !== null && role !== undefined && INVENTORY_ROLES.includes(role)
}

export function homePathForRole(role: string | null | undefined): string {
  if (role === null || role === undefined) return '/login'
  return hasManagementCapabilities(role) ? '/app' : '/mi-cuenta'
}
