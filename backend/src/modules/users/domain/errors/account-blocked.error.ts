export class AccountBlockedError extends Error {
  constructor() {
    super('User is administratively blocked');
    this.name = 'AccountBlockedError';
  }
}
