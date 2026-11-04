import {
  CANONICAL_ROLE_CODES,
  SYSTEM_ADMIN_ROLE,
} from './canonical-role-catalog';

export const GENERAL_ACCOUNT_ROLE = 'Subscription_L1';
export const COMMUNITY_ACCOUNT_ROLE = 'ROLE_COMMUNITY_USER';
export const LEGACY_COMMUNITY_ACCOUNT_ROLE = 'Cuenta comunitaria';
export const ERP_ADMITTED_V2_ROLES = [
  SYSTEM_ADMIN_ROLE,
  ...CANONICAL_ROLE_CODES.filter(
    (role) => role !== COMMUNITY_ACCOUNT_ROLE && role !== SYSTEM_ADMIN_ROLE,
  ),
] as const;

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

  if (
    ERP_ADMITTED_V2_ROLES.some((role) => role === context.userRoleName)
  ) {
    return true;
  }

  if (
    context.userRoleName === COMMUNITY_ACCOUNT_ROLE ||
    context.userRoleName === LEGACY_COMMUNITY_ACCOUNT_ROLE
  ) {
    return false;
  }

  return (
    context.hasPerson &&
    context.affiliateStatus === 'ACTIVE' &&
    context.userRoleName !== GENERAL_ACCOUNT_ROLE
  );
}
