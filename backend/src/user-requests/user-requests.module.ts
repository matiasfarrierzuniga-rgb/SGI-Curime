import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { PublicRequestRateLimitModule } from '../common/rate-limit/public-request-rate-limit.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { InboxNotificationsModule } from '../modules/notifications/inbox-notifications.module';
import { IdentityModule } from '../identity/identity.module';
import { ActivationTokenDeliveryService } from './activation-token-delivery.service';
import { ActivationTokenService } from './activation-token.service';
import { UserRequestsController } from './user-requests.controller';
import { UserRequestsService } from './user-requests.service';
import { CommunityAccountsController } from './community-accounts.controller';
import { CommunityAccountsService } from './community-accounts.service';
import { CommunityEmailVerificationDeliveryService } from './community-email-verification-delivery.service';
import { QaFakeEmailInboxController } from './qa-fake-email-inbox.controller';

@Module({
  imports: [
    AuthModule,
    IdentityModule,
    PublicRequestRateLimitModule,
    NotificationsModule.forRoot({
      baseUrl: publicAppUrl(),
    }),
    InboxNotificationsModule,
  ],
  controllers: [
    UserRequestsController,
    CommunityAccountsController,
    QaFakeEmailInboxController,
  ],
  providers: [
    UserRequestsService,
    ActivationTokenService,
    ActivationTokenDeliveryService,
    CommunityAccountsService,
    CommunityEmailVerificationDeliveryService,
  ],
  exports: [UserRequestsService],
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
