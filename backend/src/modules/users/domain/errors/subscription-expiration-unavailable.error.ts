export class SubscriptionExpirationUnavailableError extends Error {
  constructor() {
    super(
      'Subscription expiration can only be updated for Subscription_L1 users',
    );
    this.name = 'SubscriptionExpirationUnavailableError';
  }
}
