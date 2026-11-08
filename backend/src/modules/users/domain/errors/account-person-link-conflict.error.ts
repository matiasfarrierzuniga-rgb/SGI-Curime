export class AccountPersonLinkConflictError extends Error {
  constructor() {
    super('La cuenta o la persona ya está vinculada a otra identidad.');
    this.name = 'AccountPersonLinkConflictError';
  }
}
