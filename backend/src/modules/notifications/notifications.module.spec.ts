import { Test } from '@nestjs/testing';
import type { EmailProvider } from './application/ports/email-provider.port';
import { EMAIL_PROVIDER } from './application/ports/email-provider.port';
import { FakeEmailProvider } from './infrastructure/fake-email.provider';
import { GmailAppPasswordEmailProvider } from './infrastructure/gmail-app-password-email.provider';
import { NotificationsModule } from './notifications.module';

describe('NotificationsModule provider selection', () => {
  it('uses FakeEmailProvider when real delivery is disabled', async () => {
    const module = await Test.createTestingModule({
      imports: [
        NotificationsModule.forRoot({
          baseUrl: 'https://sgi.example.test',
          environment: {
            EMAIL_PROVIDER: 'gmail-app-password',
            EMAIL_SEND_ENABLED: 'false',
          },
        }),
      ],
    }).compile();

    expect(module.get<EmailProvider>(EMAIL_PROVIDER)).toBeInstanceOf(
      FakeEmailProvider,
    );
  });

  it('selects Gmail when configured and enabled', async () => {
    const module = await Test.createTestingModule({
      imports: [
        NotificationsModule.forRoot({
          baseUrl: 'https://sgi.example.test',
          environment: {
            EMAIL_PROVIDER: 'gmail-app-password',
            EMAIL_SEND_ENABLED: 'true',
            EMAIL_FROM: 'notificaciones@example.test',
            GMAIL_USER: 'gmail-user@example.test',
            GMAIL_APP_PASSWORD: 'app-password',
          },
        }),
      ],
    }).compile();

    expect(module.get<EmailProvider>(EMAIL_PROVIDER)).toBeInstanceOf(
      GmailAppPasswordEmailProvider,
    );
  });
});
