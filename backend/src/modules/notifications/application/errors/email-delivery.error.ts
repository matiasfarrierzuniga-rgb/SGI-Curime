export enum EmailDeliveryErrorKind {
  TEMPORARY = 'TEMPORARY',
  PERMANENT = 'PERMANENT',
  CONFIGURATION = 'CONFIGURATION',
}

export class EmailDeliveryError extends Error {
  constructor(
    readonly kind: EmailDeliveryErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'EmailDeliveryError';
  }
}
