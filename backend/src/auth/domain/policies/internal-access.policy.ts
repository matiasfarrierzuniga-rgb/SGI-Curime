export const GENERAL_ACCOUNT_ROLE = 'Subscription_L1';
export const COMMUNITY_ACCOUNT_ROLE = 'ROLE_COMMUNITY_USER';
export const LEGACY_COMMUNITY_ACCOUNT_ROLE = 'Cuenta comunitaria';
export const COMMUNITY_ACCOUNT_ROLES = [
  COMMUNITY_ACCOUNT_ROLE,
  LEGACY_COMMUNITY_ACCOUNT_ROLE,
];
export function isCommunityAccountRole(role: string): boolean {
  return COMMUNITY_ACCOUNT_ROLES.includes(role);
}
const ADMINISTRATOR_ROLE = 'Administrador';
export const ERP_ADMITTED_V2_ROLES = [
  'ROLE_SYSTEM_ADMIN',
  'ROLE_INSTITUTIONAL_PRESIDENT',
  'ROLE_INSTITUTIONAL_SECRETARY',
  'ROLE_INSTITUTIONAL_TREASURER',
  'ROLE_INSTITUTIONAL_OPERATOR',
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
    context.userRoleName === ADMINISTRATOR_ROLE ||
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
