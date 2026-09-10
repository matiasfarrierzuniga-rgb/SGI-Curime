export const GENERAL_ACCOUNT_ROLE = 'Subscription_L1';

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
  return (
    context.userStatus === 'ACTIVE' &&
    context.hasPerson &&
    context.affiliateStatus === 'ACTIVE' &&
    context.affiliateRoleId !== null &&
    context.userRoleId === context.affiliateRoleId &&
    context.userRoleIsActive &&
    context.userRoleName !== GENERAL_ACCOUNT_ROLE
  );
}
