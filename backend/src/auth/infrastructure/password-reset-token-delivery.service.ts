import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../../modules/notifications/application/notification.service';
import { NotificationEventType } from '../../modules/notifications/domain/notification-event';
import type {
  PasswordResetDelivery,
  PasswordResetDeliveryPort,
} from '../application/ports/password-reset-delivery.port';

@Injectable()
export class PasswordResetTokenDeliveryService implements PasswordResetDeliveryPort {
  private readonly logger = new Logger(PasswordResetTokenDeliveryService.name);
  constructor(private readonly notifications: NotificationService) {}
  async deliver(delivery: PasswordResetDelivery): Promise<void> {
    try {
      const result = await this.notifications.send({
        type: NotificationEventType.PASSWORD_RESET_REQUESTED,
        to: delivery.email,
        recipientName: delivery.fullName,
        token: delivery.token,
      });
      if (!result.accepted) throw new Error('Delivery not accepted');
    } catch {
      this.logger.warn('Password reset delivery failed.');
    }
  }
}
