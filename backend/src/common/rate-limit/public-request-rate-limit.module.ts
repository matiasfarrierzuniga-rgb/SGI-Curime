import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { publicRequestRateLimitConfig } from './public-request-rate-limit.config';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: () => [publicRequestRateLimitConfig()],
    }),
  ],
  exports: [ThrottlerModule],
})
export class PublicRequestRateLimitModule {}
