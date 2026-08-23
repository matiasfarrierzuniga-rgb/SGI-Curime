import { Injectable } from '@nestjs/common';

export type ActivationDelivery = {
  email: string;
  fullName: string;
  token: string;
  expiresAt: Date;
};

@Injectable()
export class ActivationTokenDeliveryService {
  deliver(_delivery: ActivationDelivery): Promise<void> {
    void _delivery;
    // Integration point for a future email provider. Never log the token.
    return Promise.resolve();
  }
}
