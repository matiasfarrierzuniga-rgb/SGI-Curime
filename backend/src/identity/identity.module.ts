import { Module } from '@nestjs/common';
import { PublicRequestRateLimitModule } from '../common/rate-limit/public-request-rate-limit.module';
import { IdentityLookupController } from './identity-lookup.controller';
import { IdentityLookupService } from './identity-lookup.service';
import { RuntimePersonResolverService } from './runtime-person-resolver.service';

@Module({
  imports: [PublicRequestRateLimitModule],
  controllers: [IdentityLookupController],
  providers: [IdentityLookupService, RuntimePersonResolverService],
  exports: [IdentityLookupService, RuntimePersonResolverService],
})
export class IdentityModule {}
