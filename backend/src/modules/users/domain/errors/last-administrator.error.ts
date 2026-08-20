export class LastAdministratorError extends Error {
  constructor() {
    super('The last active administrator cannot be deactivated or demoted');
    this.name = 'LastAdministratorError';
  }
}
