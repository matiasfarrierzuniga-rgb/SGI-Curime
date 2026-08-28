import type { EmailMessage, EmailSendResult } from '../../domain/email-message';

export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
}
