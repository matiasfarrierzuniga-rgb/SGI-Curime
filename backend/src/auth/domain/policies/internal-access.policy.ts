import {
  CANONICAL_ROLE_CODES,
  type CanonicalRoleCode,
  SYSTEM_ADMIN_ROLE,
} from './canonical-role-catalog';

export const COMMUNITY_ACCOUNT_ROLE = 'ROLE_COMMUNITY_USER';
export function isCommunityAccountRole(role: string): boolean {
  return role === COMMUNITY_ACCOUNT_ROLE;
}
export const ERP_ADMITTED_V2_ROLES = [
  SYSTEM_ADMIN_ROLE,
  ...CANONICAL_ROLE_CODES.filter(
    (role) => role !== COMMUNITY_ACCOUNT_ROLE && role !== SYSTEM_ADMIN_ROLE,
  ),
] as const satisfies readonly CanonicalRoleCode[];

export interface InternalAccessContext {
  userStatus: string;
  userRoleName: string;
  userRoleIsActive: boolean;
  hasPerson: boolean;
  affiliateStatus: string | null;
}

export function canAccessErp(context: InternalAccessContext): boolean {
  if (context.userStatus !== 'ACTIVE' || !context.userRoleIsActive) {
    return false;
  }

  // ERP admission is determined exclusively by the active canonical role.
  // Retained Person/Affiliate fields are compatibility context only; they never
  // grant administrative access.
  return ERP_ADMITTED_V2_ROLES.includes(
    context.userRoleName as (typeof ERP_ADMITTED_V2_ROLES)[number],
  );
}
