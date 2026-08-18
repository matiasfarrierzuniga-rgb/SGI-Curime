import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AffiliateRequestsController } from './affiliate-requests.controller';
import { AffiliateRequestsService } from './affiliate-requests.service';
@Module({
  imports: [AuthModule],
  controllers: [AffiliateRequestsController],
  providers: [AffiliateRequestsService],
})
export class AffiliateRequestsModule {}
