import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { PublicRequestRateLimitModule } from '../common/rate-limit/public-request-rate-limit.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { ActivationTokenDeliveryService } from './activation-token-delivery.service';
import { ActivationTokenService } from './activation-token.service';
import { UserRequestsController } from './user-requests.controller';
import { UserRequestsService } from './user-requests.service';

@Module({
  imports: [
    AuthModule,
    PublicRequestRateLimitModule,
    NotificationsModule.forRoot({
      baseUrl: publicAppUrl(),
    }),
  ],
  controllers: [UserRequestsController],
  providers: [
    UserRequestsService,
    ActivationTokenService,
    ActivationTokenDeliveryService,
  ],
})
export class UserRequestsModule {}

function publicAppUrl(): string {
  const value = process.env.APP_PUBLIC_URL ?? process.env.FRONTEND_URL;
  if (!value && process.env.NODE_ENV === 'test') {
    return 'https://sgi.example.test';
  }
  if (!value) {
    throw new Error('APP_PUBLIC_URL must be configured.');
  }
  return value;
}
