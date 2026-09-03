export const ROLE_ADMIN = 'Administrador'
export const ROLE_INVENTORY_MANAGER = 'Gestor de Inventario'

export type RoleLike =
  | string
  | {
    name?: string | null
  }
  | null
  | undefined

export const ADMIN_ROLES: readonly string[] = [ROLE_ADMIN]

export const INVENTORY_ROLES: readonly string[] = [
  ROLE_ADMIN,
  ROLE_INVENTORY_MANAGER,
]

export function getRoleName(role: RoleLike): string | undefined {
  if (!role) return undefined

  if (typeof role === 'string') {
    return role
  }

  return role.name ?? undefined
}

export function isAdmin(role: RoleLike): boolean {
  return getRoleName(role) === ROLE_ADMIN
}

export function canManageInventory(role: RoleLike): boolean {
  const roleName = getRoleName(role)

  return (
    roleName !== undefined &&
    INVENTORY_ROLES.includes(roleName)
  )
}

export function homePathForRole(role: RoleLike): string {
  return getRoleName(role) ? '/app' : '/login'
}