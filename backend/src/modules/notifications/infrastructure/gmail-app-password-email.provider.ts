import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import {
  EmailDeliveryError,
  EmailDeliveryErrorKind,
} from '../application/errors/email-delivery.error';
import type { EmailProvider } from '../application/ports/email-provider.port';
import type { EmailMessage, EmailSendResult } from '../domain/email-message';

export interface GmailAppPasswordConfig {
  readonly from: string;
  readonly fromName: string;
  readonly replyTo?: string;
  readonly user: string;
  readonly appPassword: string;
}

export type GmailTransportFactory = (
  options: SMTPTransport.Options,
) => Transporter<SMTPTransport.SentMessageInfo>;

export class GmailAppPasswordEmailProvider implements EmailProvider {
  private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>;

  constructor(
    private readonly config: GmailAppPasswordConfig,
    transportFactory: GmailTransportFactory = nodemailer.createTransport,
  ) {
    this.transporter = transportFactory({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.user,
        pass: config.appPassword,
      },
    });
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const result = await this.transporter.sendMail({
        to: message.to,
        from: {
          name: this.config.fromName,
          address: this.config.from,
        },
        replyTo: this.config.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      return {
        messageId: result.messageId,
        accepted: result.accepted.length > 0,
      };
    } catch (error: unknown) {
      throw mapGmailDeliveryError(error);
    }
  }
}

interface SmtpFailure {
  readonly code?: unknown;
  readonly responseCode?: unknown;
}

export function mapGmailDeliveryError(error: unknown): EmailDeliveryError {
  const failure = isSmtpFailure(error) ? error : {};
  const code = typeof failure.code === 'string' ? failure.code : undefined;
  const responseCode =
    typeof failure.responseCode === 'number' ? failure.responseCode : undefined;

  if (code === 'EAUTH' || responseCode === 534 || responseCode === 535) {
    return new EmailDeliveryError(
      EmailDeliveryErrorKind.CONFIGURATION,
      'Gmail authentication failed. Verify the configured App Password.',
    );
  }

  if (responseCode !== undefined && responseCode >= 500) {
    return new EmailDeliveryError(
      EmailDeliveryErrorKind.PERMANENT,
      'Gmail permanently rejected the email delivery.',
    );
  }

  return new EmailDeliveryError(
    EmailDeliveryErrorKind.TEMPORARY,
    'Gmail email delivery failed temporarily.',
  );
}

function isSmtpFailure(error: unknown): error is SmtpFailure {
  return typeof error === 'object' && error !== null;
}
