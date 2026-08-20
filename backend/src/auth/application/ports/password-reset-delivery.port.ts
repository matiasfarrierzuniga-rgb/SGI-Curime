export interface PasswordResetDelivery {
  email: string;
  fullName: string;
  token: string;
  expiresAt: Date;
}

export interface PasswordResetDeliveryPort {
  deliver(delivery: PasswordResetDelivery): Promise<void>;
}
