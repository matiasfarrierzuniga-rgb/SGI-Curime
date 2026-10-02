import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { AuditModule } from '../audit/audit.module';
import { PublicRequestRateLimitModule } from '../common/rate-limit/public-request-rate-limit.module';
import { IdentityModule } from '../identity/identity.module';
import { AffiliateRequestsController } from './affiliate-requests.controller';
import { AffiliateRequestsService } from './affiliate-requests.service';
@Module({
  imports: [AuthModule, AuditModule, IdentityModule, PublicRequestRateLimitModule],
  controllers: [AffiliateRequestsController],
  providers: [AffiliateRequestsService],
})
export class AffiliateRequestsModule {}
