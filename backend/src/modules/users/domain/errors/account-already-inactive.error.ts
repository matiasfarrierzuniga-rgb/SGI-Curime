export class AccountAlreadyInactiveError extends Error {
  constructor() {
    super('User is already inactive');
    this.name = 'AccountAlreadyInactiveError';
  }
}
