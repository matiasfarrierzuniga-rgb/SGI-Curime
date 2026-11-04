export const CANONICAL_ROLES = [
  {
    code: 'ROLE_COMMUNITY_USER',
    label: 'Usuario comunitario',
    description: 'Acceso mínimo para una cuenta comunitaria verificada.',
  },
  {
    code: 'ROLE_SYSTEM_ADMIN',
    label: 'Administrador del sistema',
    description: 'Administración técnica institucional RBAC V2.',
  },
  {
    code: 'ROLE_INSTITUTIONAL_PRESIDENT',
    label: 'Presidencia institucional',
    description: 'Rol institucional V2 de presidencia.',
  },
  {
    code: 'ROLE_INSTITUTIONAL_SECRETARY',
    label: 'Secretaría institucional',
    description: 'Rol institucional V2 de secretaría.',
  },
  {
    code: 'ROLE_INSTITUTIONAL_TREASURER',
    label: 'Tesorería institucional',
    description: 'Rol institucional V2 de tesorería.',
  },
  {
    code: 'ROLE_INSTITUTIONAL_OPERATOR',
    label: 'Operador institucional',
    description: 'Rol institucional V2 operativo.',
  },
] as const;

export type CanonicalRoleCode = (typeof CANONICAL_ROLES)[number]['code'];

export const CANONICAL_ROLE_CODES = CANONICAL_ROLES.map((role) => role.code);
export const SYSTEM_ADMIN_ROLE: CanonicalRoleCode = 'ROLE_SYSTEM_ADMIN';

export function isCanonicalRoleCode(code: string): code is CanonicalRoleCode {
  return CANONICAL_ROLE_CODES.some((canonicalCode) => canonicalCode === code);
}

export function getCanonicalRoleLabel(code: CanonicalRoleCode): string {
  return CANONICAL_ROLES.find((role) => role.code === code)!.label;
}
