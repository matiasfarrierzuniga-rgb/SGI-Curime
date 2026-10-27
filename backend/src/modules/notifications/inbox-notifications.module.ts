import { Module } from '@nestjs/common';
import { InboxNotificationService } from './application/inbox-notification.service';
import { InboxNotificationsController } from './presentation/controllers/inbox-notifications.controller';

@Module({
  controllers: [InboxNotificationsController],
  providers: [InboxNotificationService],
  exports: [InboxNotificationService],
})
export class InboxNotificationsModule {}
