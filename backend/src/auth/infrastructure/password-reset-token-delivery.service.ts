import { Injectable } from '@nestjs/common';
import type {
  PasswordResetDelivery,
  PasswordResetDeliveryPort,
} from '../application/ports/password-reset-delivery.port';

@Injectable()
export class PasswordResetTokenDeliveryService implements PasswordResetDeliveryPort {
  deliver(delivery: PasswordResetDelivery): Promise<void> {
    void delivery;
    // Integration point for a future email provider. Never log the token.
    return Promise.resolve();
  }
}
