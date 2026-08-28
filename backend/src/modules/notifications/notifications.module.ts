import { DynamicModule, Module } from '@nestjs/common';
import { NotificationService } from './application/notification.service';
import {
  NOTIFICATION_URL_CONFIG,
  NotificationUrlBuilder,
  type NotificationUrlConfig,
} from './application/notification-url-builder';
import { EMAIL_PROVIDER } from './application/ports/email-provider.port';
import {
  EMAIL_RUNTIME_CONFIG,
  loadEmailConfig,
  type EmailRuntimeConfig,
  type NotificationEnvironment,
} from './infrastructure/config/email.config';
import { FakeEmailProvider } from './infrastructure/fake-email.provider';
import { GmailAppPasswordEmailProvider } from './infrastructure/gmail-app-password-email.provider';

export interface NotificationsModuleOptions extends NotificationUrlConfig {
  readonly environment?: NotificationEnvironment;
}

@Module({})
export class NotificationsModule {
  static forRoot(options: NotificationsModuleOptions): DynamicModule {
    const emailConfig = loadEmailConfig(options.environment ?? process.env);
    return {
      module: NotificationsModule,
      providers: [
        {
          provide: NOTIFICATION_URL_CONFIG,
          useValue: { baseUrl: options.baseUrl },
        },
        { provide: EMAIL_RUNTIME_CONFIG, useValue: emailConfig },
        FakeEmailProvider,
        {
          provide: EMAIL_PROVIDER,
          inject: [EMAIL_RUNTIME_CONFIG, FakeEmailProvider],
          useFactory: (
            config: EmailRuntimeConfig,
            fakeProvider: FakeEmailProvider,
          ) => createEmailProvider(config, fakeProvider),
        },
        NotificationUrlBuilder,
        NotificationService,
      ],
      exports: [NotificationService, EMAIL_PROVIDER],
    };
  }
}

function createEmailProvider(
  config: EmailRuntimeConfig,
  fakeProvider: FakeEmailProvider,
) {
  if (!config.sendEnabled || config.provider === 'fake') {
    return fakeProvider;
  }

  return new GmailAppPasswordEmailProvider({
    from: requireConfigured(config.from, 'EMAIL_FROM'),
    fromName: config.fromName,
    replyTo: config.replyTo,
    user: requireConfigured(config.gmailUser, 'GMAIL_USER'),
    appPassword: requireConfigured(
      config.gmailAppPassword,
      'GMAIL_APP_PASSWORD',
    ),
  });
}

function requireConfigured(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Email configuration is incomplete. Missing: ${name}.`);
  }
  return value;
}
