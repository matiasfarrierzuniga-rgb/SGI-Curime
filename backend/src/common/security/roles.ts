export const ROLE_NAMES = {
  ADMIN: 'Administrador',
  TREASURER: 'Tesorero',
  INVENTORY_MANAGER: 'Gestor de Inventario',
  USER: 'Usuario',
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

/**
 * @deprecated Transitional compatibility for existing data only. Do not use
 * this role for new accounts or authorization rules. It has no administrative
 * capabilities.
 */
export const LEGACY_ROLE_NAMES = {
  COMMUNITY_MEMBER: 'Vecino/Afiliado',
} as const;

export type LegacyRoleName =
  (typeof LEGACY_ROLE_NAMES)[keyof typeof LEGACY_ROLE_NAMES];
