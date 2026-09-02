export class AdministratorRegistrationForbiddenError extends Error {
  constructor() {
    super('Administrator role is required');
    this.name = 'AdministratorRegistrationForbiddenError';
  }
}
