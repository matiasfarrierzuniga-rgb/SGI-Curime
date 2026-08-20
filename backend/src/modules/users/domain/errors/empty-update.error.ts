export class EmptyUpdateError extends Error {
  constructor() {
    super('At least one editable field is required');
    this.name = 'EmptyUpdateError';
  }
}
