import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { PublicReservationsController, ReservationsController, ReservableResourcesController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { InboxNotificationsModule } from '../modules/notifications/inbox-notifications.module';

@Module({
  imports: [AuthModule, InboxNotificationsModule],
  controllers: [ReservationsController, ReservableResourcesController, PublicReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
