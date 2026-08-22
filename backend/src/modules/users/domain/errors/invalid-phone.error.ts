export class InvalidPhoneError extends Error {
  constructor() {
    super('El teléfono no es válido');
    this.name = 'InvalidPhoneError';
  }
}
