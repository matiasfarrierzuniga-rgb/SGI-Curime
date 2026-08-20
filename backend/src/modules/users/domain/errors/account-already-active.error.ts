export class AccountAlreadyActiveError extends Error {
  constructor() {
    super('User is already active');
    this.name = 'AccountAlreadyActiveError';
  }
}
