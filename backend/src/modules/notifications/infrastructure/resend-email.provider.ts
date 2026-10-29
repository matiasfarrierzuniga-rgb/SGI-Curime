import {
  EmailDeliveryError,
  EmailDeliveryErrorKind,
} from '../application/errors/email-delivery.error';
import type { EmailProvider } from '../application/ports/email-provider.port';
import type { EmailMessage, EmailSendResult } from '../domain/email-message';

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';

export interface ResendEmailConfig {
  readonly apiKey: string;
  readonly from: string;
  readonly fromName: string;
  readonly replyTo?: string;
  readonly qaAllowedRecipient?: string;
  readonly timeoutMs: number;
}

export interface ResendHttpResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

export type ResendHttpClient = (
  url: string,
  init: RequestInit,
) => Promise<ResendHttpResponse>;

export class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly config: ResendEmailConfig,
    private readonly httpClient: ResendHttpClient = fetch,
  ) {}

  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (
      this.config.qaAllowedRecipient &&
      !isAllowedRecipient(message.to, this.config.qaAllowedRecipient)
    ) {
      throw new EmailDeliveryError(
        EmailDeliveryErrorKind.PERMANENT,
        'Resend QA recipient is not permitted.',
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await this.httpClient(RESEND_EMAILS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          ...(message.idempotencyKey
            ? { 'Idempotency-Key': message.idempotencyKey }
            : {}),
        },
        body: JSON.stringify({
          from: `${this.config.fromName} <${this.config.from}>`,
          to: [message.to],
          reply_to: this.config.replyTo,
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw mapResendHttpError(response.status);
      const body = await response.json();
      const messageId = readMessageId(body);
      if (!messageId) {
        throw new EmailDeliveryError(
          EmailDeliveryErrorKind.TEMPORARY,
          'Resend did not return an email identifier.',
        );
      }
      return { messageId, accepted: true };
    } catch (error: unknown) {
      if (error instanceof EmailDeliveryError) throw error;
      throw mapResendTransportError(error);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function mapResendHttpError(status: number): EmailDeliveryError {
  if (status === 401 || status === 403) {
    return new EmailDeliveryError(
      EmailDeliveryErrorKind.CONFIGURATION,
      'Resend rejected the configured API key or sender.',
    );
  }
  if (status === 429 || status >= 500) {
    return new EmailDeliveryError(
      EmailDeliveryErrorKind.TEMPORARY,
      'Resend email delivery failed temporarily.',
    );
  }
  return new EmailDeliveryError(
    EmailDeliveryErrorKind.PERMANENT,
    'Resend permanently rejected the email delivery.',
  );
}

function mapResendTransportError(error: unknown): EmailDeliveryError {
  if (isAbortError(error)) {
    return new EmailDeliveryError(
      EmailDeliveryErrorKind.TEMPORARY,
      'Resend email delivery timed out.',
    );
  }
  return new EmailDeliveryError(
    EmailDeliveryErrorKind.TEMPORARY,
    'Resend email delivery failed temporarily.',
  );
}

function isAllowedRecipient(
  recipient: string,
  allowedRecipient: string,
): boolean {
  return (
    recipient.trim().toLowerCase() === allowedRecipient.trim().toLowerCase()
  );
}

function readMessageId(body: unknown): string | undefined {
  if (
    typeof body === 'object' &&
    body !== null &&
    'id' in body &&
    typeof body.id === 'string' &&
    body.id.trim()
  ) {
    return body.id;
  }
  return undefined;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  );
}
