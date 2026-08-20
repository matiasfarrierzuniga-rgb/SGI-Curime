export class ActivationNotCompletedError extends Error {
  constructor() {
    super('Account activation has not been completed');
    this.name = 'ActivationNotCompletedError';
  }
}
