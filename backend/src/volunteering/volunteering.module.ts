import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth';
import { PublicRequestRateLimitModule } from '../common/rate-limit/public-request-rate-limit.module';
import {
  PublicVolunteeringOpportunitiesController,
  VolunteeringApplicationsController,
  VolunteeringOpportunitiesController,
} from './volunteering-opportunities.controller';
import { VolunteeringOpportunitiesService } from './volunteering-opportunities.service';
import { VolunteeringApplicationsService } from './volunteering-applications.service';

@Module({
  imports: [AuthModule, AuditModule, PublicRequestRateLimitModule],
  controllers: [
    VolunteeringOpportunitiesController,
    PublicVolunteeringOpportunitiesController,
    VolunteeringApplicationsController,
  ],
  providers: [
    VolunteeringOpportunitiesService,
    VolunteeringApplicationsService,
  ],
})
export class VolunteeringModule {}
