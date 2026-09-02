export class SelfDeactivationError extends Error {
  constructor() {
    super('Administrators cannot deactivate themselves');
    this.name = 'SelfDeactivationError';
  }
}
