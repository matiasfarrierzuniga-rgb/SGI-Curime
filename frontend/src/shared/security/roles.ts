export const ROLE_ADMIN = 'Administrador'
export const ROLE_INVENTORY_MANAGER = 'Gestor de Inventario'

export const ADMIN_ROLES: readonly string[] = [ROLE_ADMIN]
export const INVENTORY_ROLES: readonly string[] = [ROLE_ADMIN, ROLE_INVENTORY_MANAGER]

export function isAdmin(role: string | null | undefined): boolean {
  return role === ROLE_ADMIN
}

export function canManageInventory(role: string | null | undefined): boolean {
  return role !== null && role !== undefined && INVENTORY_ROLES.includes(role)
}

export function homePathForRole(role: string | null | undefined): string {
  return role ? '/app' : '/login'
}
