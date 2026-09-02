export const ROLE_NAMES = {
  ADMIN: 'Administrador',
  TREASURER: 'Tesorero',
  INVENTORY_MANAGER: 'Gestor de Inventario',
  USER: 'Usuario',
} as const

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES]

/** @deprecated Compatibilidad transitoria hasta migrar los datos existentes. */
export const LEGACY_ROLE_NAMES = {
  COMMUNITY_MEMBER: 'Vecino/Afiliado',
} as const
