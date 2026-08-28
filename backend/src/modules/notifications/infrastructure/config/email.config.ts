export type EmailProviderName = 'fake' | 'gmail-app-password';

export interface EmailRuntimeConfig {
  readonly provider: EmailProviderName;
  readonly sendEnabled: boolean;
  readonly from?: string;
  readonly fromName: string;
  readonly replyTo?: string;
  readonly gmailUser?: string;
  readonly gmailAppPassword?: string;
}

export type NotificationEnvironment = Readonly<
  Record<string, string | undefined>
>;

export const EMAIL_RUNTIME_CONFIG = Symbol('EMAIL_RUNTIME_CONFIG');

const INSTITUTION_NAME = 'Asociación de Desarrollo Integral de Curime';

export function loadEmailConfig(
  environment: NotificationEnvironment,
): EmailRuntimeConfig {
  const provider = parseProvider(environment.EMAIL_PROVIDER);
  const sendEnabled = parseSendEnabled(environment.EMAIL_SEND_ENABLED);
  const config: EmailRuntimeConfig = {
    provider,
    sendEnabled,
    from: optionalValue(environment.EMAIL_FROM),
    fromName: optionalValue(environment.EMAIL_FROM_NAME) ?? INSTITUTION_NAME,
    replyTo: optionalValue(environment.EMAIL_REPLY_TO),
    gmailUser: optionalValue(environment.GMAIL_USER),
    gmailAppPassword: optionalValue(environment.GMAIL_APP_PASSWORD),
  };

  validateHeaderValue('EMAIL_FROM', config.from);
  validateHeaderValue('EMAIL_FROM_NAME', config.fromName);
  validateHeaderValue('EMAIL_REPLY_TO', config.replyTo);

  if (sendEnabled && provider === 'gmail-app-password') {
    const missing = [
      ['EMAIL_FROM', config.from],
      ['GMAIL_USER', config.gmailUser],
      ['GMAIL_APP_PASSWORD', config.gmailAppPassword],
    ]
      .filter((entry) => !entry[1])
      .map((entry) => entry[0]);

    if (missing.length > 0) {
      throw new Error(
        `Email configuration is incomplete. Missing: ${missing.join(', ')}.`,
      );
    }
  }

  return config;
}

function parseProvider(value: string | undefined): EmailProviderName {
  const provider = optionalValue(value) ?? 'fake';
  if (provider !== 'fake' && provider !== 'gmail-app-password') {
    throw new Error(
      'EMAIL_PROVIDER must be either "fake" or "gmail-app-password".',
    );
  }
  return provider;
}

function parseSendEnabled(value: string | undefined): boolean {
  const normalized = optionalValue(value)?.toLowerCase() ?? 'false';
  if (normalized !== 'true' && normalized !== 'false') {
    throw new Error('EMAIL_SEND_ENABLED must be either "true" or "false".');
  }
  return normalized === 'true';
}

function optionalValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function validateHeaderValue(name: string, value: string | undefined): void {
  if (value && /[\r\n]/.test(value)) {
    throw new Error(`${name} cannot contain CR or LF characters.`);
  }
}
