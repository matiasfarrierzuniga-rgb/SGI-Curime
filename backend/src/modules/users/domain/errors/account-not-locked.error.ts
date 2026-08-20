export class AccountNotLockedError extends Error {
  constructor() {
    super('User is not temporarily locked');
    this.name = 'AccountNotLockedError';
  }
}
