import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { PublicRequestRateLimitModule } from '../common/rate-limit/public-request-rate-limit.module';
import {
  DonationRequestsController,
  PublicDonationRequestsController,
} from './donation-requests.controller';
import { DonationRequestsService } from './donation-requests.service';

@Module({
  imports: [AuthModule, PublicRequestRateLimitModule],
  controllers: [PublicDonationRequestsController, DonationRequestsController],
  providers: [DonationRequestsService],
})
export class DonationRequestsModule {}
