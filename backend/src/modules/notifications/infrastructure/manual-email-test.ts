import {
  EmailDeliveryError,
  EmailDeliveryErrorKind,
} from '../application/errors/email-delivery.error';
import type { EmailProvider } from '../application/ports/email-provider.port';
import {
  loadEmailConfig,
  type EmailRuntimeConfig,
  type NotificationEnvironment,
} from './config/email.config';
import { GmailAppPasswordEmailProvider } from './gmail-app-password-email.provider';

const TEST_SUBJECT = 'Prueba de correo SGI-Curime';
const TEST_TEXT =
  'Este es un correo de prueba del sistema de notificaciones de SGI-Curime.';

export interface ManualEmailTestLogger {
  info(message: string): void;
}

export interface ManualEmailTestOptions {
  readonly recipient: string | undefined;
  readonly environment: NotificationEnvironment;
  readonly logger: ManualEmailTestLogger;
  readonly providerFactory?: (config: EmailRuntimeConfig) => EmailProvider;
}

export class ManualEmailTestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ManualEmailTestError';
  }
}

export async function runManualEmailTest(
  options: ManualEmailTestOptions,
): Promise<void> {
  const recipient = validateRecipient(options.recipient);
  const config = safelyLoadConfig(options.environment);

  if (!config.sendEnabled) {
    throw new ManualEmailTestError(
      'Manual email test refused: EMAIL_SEND_ENABLED must be true.',
    );
  }
  if (config.provider !== 'gmail-app-password') {
    throw new ManualEmailTestError(
      'Manual email test refused: EMAIL_PROVIDER must be gmail-app-password.',
    );
  }

  const providerFactory = options.providerFactory ?? createGmailProvider;
  const provider = providerFactory(config);

  options.logger.info('Configuración de correo válida.');
  options.logger.info('Intento de envío iniciado.');
  await provider.send({
    to: recipient,
    subject: TEST_SUBJECT,
    html: `<p>${TEST_TEXT}</p>`,
    text: TEST_TEXT,
  });
  options.logger.info('Correo de prueba enviado.');
}

export function validateRecipient(value: string | undefined): string {
  const recipient = value?.trim();
  if (
    !recipient ||
    recipient.length > 254 ||
    /[\r\n]/.test(recipient) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)
  ) {
    throw new ManualEmailTestError(
      'Provide one valid recipient email as the command argument.',
    );
  }
  return recipient;
}

export function sanitizeManualEmailError(error: unknown): string {
  if (error instanceof ManualEmailTestError) {
    return error.message;
  }
  if (error instanceof EmailDeliveryError) {
    const prefix =
      error.kind === EmailDeliveryErrorKind.CONFIGURATION
        ? 'Email configuration error'
        : 'Email delivery error';
    return `${prefix}: ${error.message}`;
  }
  return 'Manual email test failed unexpectedly.';
}

function safelyLoadConfig(
  environment: NotificationEnvironment,
): EmailRuntimeConfig {
  try {
    return loadEmailConfig(environment);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Email configuration validation failed.';
    throw new ManualEmailTestError(message);
  }
}

function createGmailProvider(config: EmailRuntimeConfig): EmailProvider {
  return new GmailAppPasswordEmailProvider({
    from: requireValue(config.from, 'EMAIL_FROM'),
    fromName: config.fromName,
    replyTo: config.replyTo,
    user: requireValue(config.gmailUser, 'GMAIL_USER'),
    appPassword: requireValue(config.gmailAppPassword, 'GMAIL_APP_PASSWORD'),
  });
}

function requireValue(value: string | undefined, name: string): string {
  if (!value) {
    throw new ManualEmailTestError(
      `Email configuration is incomplete. Missing: ${name}.`,
    );
  }
  return value;
}
