export class RegistrationConflictError extends Error {
  constructor() {
    super('Email or identification is already registered');
    this.name = 'RegistrationConflictError';
  }
}
