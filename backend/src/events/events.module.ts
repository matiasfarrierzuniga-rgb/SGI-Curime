import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { EventsController, PublicEventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [AuthModule],
  controllers: [EventsController, PublicEventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
