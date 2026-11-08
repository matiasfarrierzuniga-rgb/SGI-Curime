import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { PublicRequestRateLimitModule } from '../common/rate-limit/public-request-rate-limit.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { InboxNotificationsModule } from '../modules/notifications/inbox-notifications.module';
import { ActivationTokenService } from './activation-token.service';
import { CommunityAccountsController } from './community-accounts.controller';
import { CommunityAccountsService } from './community-accounts.service';
import { CommunityEmailVerificationDeliveryService } from './community-email-verification-delivery.service';
import { QaFakeEmailInboxController } from './qa-fake-email-inbox.controller';

@Module({
  imports: [
    AuthModule,
    PublicRequestRateLimitModule,
    NotificationsModule.forRoot({ baseUrl: publicAppUrl() }),
    InboxNotificationsModule,
  ],
  controllers: [CommunityAccountsController, QaFakeEmailInboxController],
  providers: [
    ActivationTokenService,
    CommunityAccountsService,
    CommunityEmailVerificationDeliveryService,
  ],
  exports: [CommunityAccountsService],
})
export class CommunityAccountsModule {}

function publicAppUrl(): string {
  const value = process.env.APP_PUBLIC_URL ?? process.env.FRONTEND_URL;
  if (!value && process.env.NODE_ENV === 'test')
    return 'https://sgi.example.test';
  if (!value) throw new Error('APP_PUBLIC_URL must be configured.');
  return value;
}
