export const PASSWORD_RESET_DELIVERY_PORT = Symbol(
  'PASSWORD_RESET_DELIVERY_PORT',
);

export interface PasswordResetDelivery {
  email: string;
  fullName: string;
  token: string;
  expiresAt: Date;
}

export interface PasswordResetDeliveryPort {
  deliver(delivery: PasswordResetDelivery): Promise<void>;
}
