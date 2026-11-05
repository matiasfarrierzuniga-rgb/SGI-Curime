export type EmailProviderName = 'fake' | 'gmail-app-password' | 'resend';

export interface EmailRuntimeConfig {
  readonly provider: EmailProviderName;
  readonly sendEnabled: boolean;
  readonly from?: string;
  readonly fromName: string;
  readonly replyTo?: string;
  readonly gmailUser?: string;
  readonly gmailAppPassword?: string;
  readonly resendApiKey?: string;
  readonly resendQaAllowedRecipient?: string;
  readonly resendTimeoutMs: number;
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
    resendApiKey: optionalValue(environment.RESEND_API_KEY),
    resendQaAllowedRecipient: isQaEnvironment(environment)
      ? optionalValue(environment.RESEND_QA_ALLOWED_RECIPIENT)
      : undefined,
    resendTimeoutMs: parseTimeout(environment.RESEND_TIMEOUT_MS),
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

  if (sendEnabled && provider === 'resend') {
    const missing = [
      ['EMAIL_FROM', config.from],
      ['RESEND_API_KEY', config.resendApiKey],
      ...(isQaEnvironment(environment)
        ? [['RESEND_QA_ALLOWED_RECIPIENT', config.resendQaAllowedRecipient]]
        : []),
    ]
      .filter((entry) => !entry[1])
      .map((entry) => entry[0]);
    if (missing.length > 0) {
      throw new Error(
        `Email configuration is incomplete. Missing: ${missing.join(', ')}.`,
      );
    }
    if (
      isQaEnvironment(environment) &&
      !isEmail(config.resendQaAllowedRecipient)
    ) {
      throw new Error('RESEND_QA_ALLOWED_RECIPIENT must be a valid email.');
    }
    if (
      isProductionEnvironment(environment) &&
      isResendTestSender(config.from)
    ) {
      throw new Error(
        'EMAIL_FROM cannot use onboarding@resend.dev in production.',
      );
    }
  }

  return config;
}

function isQaEnvironment(environment: NotificationEnvironment): boolean {
  return environment.NODE_ENV?.trim() === 'test';
}

function isProductionEnvironment(
  environment: NotificationEnvironment,
): boolean {
  return environment.NODE_ENV?.trim() === 'production';
}

function isResendTestSender(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'onboarding@resend.dev';
}

function parseProvider(value: string | undefined): EmailProviderName {
  const provider = optionalValue(value) ?? 'fake';
  if (
    provider !== 'fake' &&
    provider !== 'gmail-app-password' &&
    provider !== 'resend'
  ) {
    throw new Error(
      'EMAIL_PROVIDER must be "fake", "gmail-app-password", or "resend".',
    );
  }
  return provider;
}

function parseTimeout(value: string | undefined): number {
  const normalized = optionalValue(value);
  if (!normalized) return 10_000;
  const timeout = Number(normalized);
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 60_000) {
    throw new Error(
      'RESEND_TIMEOUT_MS must be an integer between 1000 and 60000.',
    );
  }
  return timeout;
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

function isEmail(value: string | undefined): boolean {
  return Boolean(
    value &&
    value.length <= 254 &&
    !/[\r\n]/.test(value) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  );
}
