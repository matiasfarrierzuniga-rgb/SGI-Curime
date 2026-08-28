import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { NotificationService } from '../modules/notifications/application/notification.service';
import { NotificationEventType } from '../modules/notifications/domain/notification-event';

export type ActivationDelivery = {
  userId: number;
  email: string;
  fullName: string;
  token: string;
  expiresAt: Date;
};

@Injectable()
export class ActivationTokenDeliveryService {
  private readonly logger = new Logger(ActivationTokenDeliveryService.name);

  constructor(private readonly notifications: NotificationService) {}

  async deliver(delivery: ActivationDelivery): Promise<void> {
    try {
      await this.notifications.send({
        type: NotificationEventType.ACCOUNT_ACTIVATION_REQUESTED,
        userId: delivery.userId,
        to: delivery.email,
        recipientName: delivery.fullName,
        token: delivery.token,
        expiresAt: delivery.expiresAt,
      });
    } catch {
      this.logger.error(
        `Account activation email delivery failed after approval for userId=${delivery.userId}. Durable retry/outbox is pending.`,
      );
      throw new ServiceUnavailableException(
        'The request was approved, but the activation email could not be delivered. Please contact an administrator.',
      );
    }
  }
}
