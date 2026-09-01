import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth';
import { EventsController, PublicEventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [EventsController, PublicEventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
