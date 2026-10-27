import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { ReservationsController, ReservableResourcesController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { InboxNotificationsModule } from '../modules/notifications/inbox-notifications.module';

@Module({
  imports: [AuthModule, InboxNotificationsModule],
  controllers: [ReservationsController, ReservableResourcesController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
