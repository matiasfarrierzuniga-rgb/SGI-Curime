import { Injectable } from '@nestjs/common';

export type PasswordResetDelivery = {
  email: string;
  fullName: string;
  token: string;
  expiresAt: Date;
};

@Injectable()
export class PasswordResetTokenDeliveryService {
  async deliver(_delivery: PasswordResetDelivery): Promise<void> {
    // Integration point for a future email provider. Never log the token.
  }
}
