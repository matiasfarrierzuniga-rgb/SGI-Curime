export class RegistrationRoleUnavailableError extends Error {
  constructor() {
    super('Registration role is not configured');
    this.name = 'RegistrationRoleUnavailableError';
  }
}
