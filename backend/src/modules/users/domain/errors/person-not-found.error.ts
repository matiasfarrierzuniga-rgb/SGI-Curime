export class PersonNotFoundError extends Error {
  constructor() {
    super('Person not found');
    this.name = 'PersonNotFoundError';
  }
}
