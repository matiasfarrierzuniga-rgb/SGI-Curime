import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PublicRequestRateLimitModule } from '../common/rate-limit/public-request-rate-limit.module';
import { AffiliateRequestsController } from './affiliate-requests.controller';
import { AffiliateRequestsService } from './affiliate-requests.service';
@Module({
  imports: [AuthModule, PublicRequestRateLimitModule],
  controllers: [AffiliateRequestsController],
  providers: [AffiliateRequestsService],
})
export class AffiliateRequestsModule {}
