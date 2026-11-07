export const ROLE_COMMUNITY_ACCOUNT = "ROLE_COMMUNITY_USER";
export const LEGACY_ROLE_COMMUNITY_ACCOUNT = "Cuenta comunitaria";

export type RoleLike =
  | string
  | {
      name?: string | null;
    }
  | null
  | undefined;

export function getRoleName(role: RoleLike): string | undefined {
  if (!role) return undefined;

  if (typeof role === "string") {
    return role;
  }

  return role.name ?? undefined;
}

export function homePathForRole(role: RoleLike, canAccessErp = false): string {
  if (
    [ROLE_COMMUNITY_ACCOUNT, LEGACY_ROLE_COMMUNITY_ACCOUNT].includes(
      getRoleName(role) ?? "",
    )
  )
    return "/mi-comunidad";
  return getRoleName(role) && canAccessErp ? "/app" : "/servicios";
}

/** Etiquetas de presentación: nunca utilizar para autorización. */
export const CANONICAL_ROLE_LABELS: Readonly<Record<string, string>> = {
  ROLE_SYSTEM_ADMIN: 'Administrador del sistema',
  ROLE_INSTITUTIONAL_PRESIDENT: 'Presidente',
  ROLE_INSTITUTIONAL_SECRETARY: 'Secretario',
  ROLE_INSTITUTIONAL_TREASURER: 'Tesorero',
  ROLE_INSTITUTIONAL_OPERATOR: 'Operador institucional',
  ROLE_COMMUNITY_USER: 'Usuario comunitario',
};

export function getRoleLabel(role: RoleLike): string {
  const code = getRoleName(role);
  return code ? (CANONICAL_ROLE_LABELS[code] ?? code) : '—';
}
