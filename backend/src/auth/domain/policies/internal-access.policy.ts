export const GENERAL_ACCOUNT_ROLE = 'Subscription_L1';
const ADMINISTRATOR_ROLE = 'Administrador';

export interface InternalAccessContext {
  userStatus: string;
  userRoleId: number;
  userRoleName: string;
  userRoleIsActive: boolean;
  hasPerson: boolean;
  affiliateStatus: string | null;
  affiliateRoleId: number | null;
}

export function canAccessErp(context: InternalAccessContext): boolean {
  if (context.userStatus !== 'ACTIVE' || !context.userRoleIsActive) {
    return false;
  }

  if (context.userRoleName === ADMINISTRATOR_ROLE) {
    return true;
  }

  return (
    context.hasPerson &&
    context.affiliateStatus === 'ACTIVE' &&
    context.affiliateRoleId !== null &&
    context.userRoleId === context.affiliateRoleId &&
    context.userRoleName !== GENERAL_ACCOUNT_ROLE
  );
}
