import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { ReservationsController, ReservableResourcesController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [AuthModule],
  controllers: [ReservationsController, ReservableResourcesController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
