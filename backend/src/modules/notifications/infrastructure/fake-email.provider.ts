import { Injectable } from '@nestjs/common';
import type { EmailProvider } from '../application/ports/email-provider.port';
import type { EmailMessage, EmailSendResult } from '../domain/email-message';
import { assertSafeSubject } from '../application/template';

@Injectable()
export class FakeEmailProvider implements EmailProvider {
  private messages: EmailMessage[] = [];
  private failure: Error | undefined;

  send(message: EmailMessage): Promise<EmailSendResult> {
    return Promise.resolve().then(() => {
      if (this.failure) {
        throw this.failure;
      }
      assertSafeSubject(message.subject);
      this.messages.push({ ...message });
      return {
        messageId: `fake-${this.messages.length}`,
        accepted: true,
      };
    });
  }

  getMessages(): readonly EmailMessage[] {
    return this.messages.map((message) => ({ ...message }));
  }

  clear(): void {
    this.messages = [];
  }

  simulateFailure(error?: Error): void {
    this.failure = error ?? new Error('Simulated email delivery failure.');
  }

  clearFailure(): void {
    this.failure = undefined;
  }
}
