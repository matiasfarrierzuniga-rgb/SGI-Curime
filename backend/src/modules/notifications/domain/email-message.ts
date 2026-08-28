export type EmailAddress = string;

export interface EmailMessage {
  readonly to: EmailAddress;
  readonly from?: EmailAddress;
  readonly replyTo?: EmailAddress;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
  readonly idempotencyKey?: string;
}

export interface EmailSendResult {
  readonly messageId: string;
  readonly accepted: boolean;
}
