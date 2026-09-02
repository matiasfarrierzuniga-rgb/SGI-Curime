export class AdministratorRegistrationAuthenticationRequiredError extends Error {
  constructor() {
    super('Administrator authentication is required');
    this.name = 'AdministratorRegistrationAuthenticationRequiredError';
  }
}
