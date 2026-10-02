import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth';
import { VolunteeringOpportunitiesController } from './volunteering-opportunities.controller';
import { VolunteeringOpportunitiesService } from './volunteering-opportunities.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [VolunteeringOpportunitiesController],
  providers: [VolunteeringOpportunitiesService],
})
export class VolunteeringModule {}
