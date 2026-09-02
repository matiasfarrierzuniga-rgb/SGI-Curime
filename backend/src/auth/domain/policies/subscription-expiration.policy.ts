const SUBSCRIPTION_L1_ROLE = 'Subscription_L1';

export function isSubscriptionExpired(
  roleName: string,
  subscriptionExpirationDate: Date | null,
  now = new Date(),
): boolean {
  return (
    roleName === SUBSCRIPTION_L1_ROLE &&
    subscriptionExpirationDate !== null &&
    subscriptionExpirationDate <= now
  );
}
