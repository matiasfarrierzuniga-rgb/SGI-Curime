import { Inject, Injectable } from '@nestjs/common';
import type { EmailSendResult } from '../domain/email-message';
import {
  NOTIFICATION_EVENT_CATEGORIES,
  NotificationEventType,
  type NotificationIntent,
} from '../domain/notification-event';
import {
  EMAIL_PROVIDER,
  type EmailProvider,
} from './ports/email-provider.port';
import { NotificationUrlBuilder } from './notification-url-builder';
import { accountActivationTemplate } from './templates/account-activation.template';
import { passwordChangedTemplate } from './templates/password-changed.template';
import { passwordResetTemplate } from './templates/password-reset.template';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProvider,
    private readonly urlBuilder: NotificationUrlBuilder,
  ) {}

  async send(intent: NotificationIntent): Promise<EmailSendResult> {
    const template = this.render(intent);
    return this.emailProvider.send({
      to: intent.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: intent.idempotencyKey,
    });
  }

  categoryOf(type: NotificationEventType) {
    return NOTIFICATION_EVENT_CATEGORIES[type];
  }

  private render(intent: NotificationIntent) {
    switch (intent.type) {
      case NotificationEventType.ACCOUNT_ACTIVATION_REQUESTED:
        return accountActivationTemplate({
          recipientName: intent.recipientName,
          activationUrl: this.urlBuilder.activation(intent.token),
          expiresAt: intent.expiresAt,
        });
      case NotificationEventType.PASSWORD_RESET_REQUESTED:
        return passwordResetTemplate({
          recipientName: intent.recipientName,
          resetUrl: this.urlBuilder.passwordReset(intent.token),
        });
      case NotificationEventType.PASSWORD_CHANGED:
        return passwordChangedTemplate({ recipientName: intent.recipientName });
      default:
        throw new Error(`No email template is registered for ${intent.type}.`);
    }
  }
}
