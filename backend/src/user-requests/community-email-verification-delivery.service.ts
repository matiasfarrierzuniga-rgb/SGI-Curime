import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../modules/notifications/application/notification.service';
import { NotificationEventType } from '../modules/notifications/domain/notification-event';

export type CommunityVerificationDelivery = {
  userId: number;
  email: string;
  fullName: string;
  token: string;
  expiresAt: Date;
};

@Injectable()
export class CommunityEmailVerificationDeliveryService {
  private readonly logger = new Logger(
    CommunityEmailVerificationDeliveryService.name,
  );

  constructor(private readonly notifications: NotificationService) {}

  async deliver(delivery: CommunityVerificationDelivery): Promise<boolean> {
    try {
      await this.notifications.send({
        type: NotificationEventType.COMMUNITY_EMAIL_VERIFICATION,
        userId: delivery.userId,
        to: delivery.email,
        recipientName: delivery.fullName,
        token: delivery.token,
        expiresAt: delivery.expiresAt,
      });
      return true;
    } catch {
      this.logger.error(
        `Community verification email delivery failed for userId=${delivery.userId}.`,
      );
      return false;
    }
  }
}
