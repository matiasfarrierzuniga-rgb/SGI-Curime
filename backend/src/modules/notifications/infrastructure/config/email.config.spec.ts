import { loadEmailConfig } from './email.config';

describe('loadEmailConfig', () => {
  it('loads all supported settings without exposing credentials', () => {
    const config = loadEmailConfig({
      EMAIL_PROVIDER: 'gmail-app-password',
      EMAIL_SEND_ENABLED: 'true',
      EMAIL_FROM: 'notificaciones@example.test',
      EMAIL_FROM_NAME: 'Asociación de Desarrollo Integral de Curime',
      EMAIL_REPLY_TO: 'contacto@example.test',
      GMAIL_USER: 'smtp-user@example.test',
      GMAIL_APP_PASSWORD: 'app-password-secret',
    });

    expect(config).toMatchObject({
      provider: 'gmail-app-password',
      sendEnabled: true,
      from: 'notificaciones@example.test',
      replyTo: 'contacto@example.test',
      gmailUser: 'smtp-user@example.test',
    });
  });

  it('fails clearly when enabled Gmail configuration is incomplete', () => {
    expect(() =>
      loadEmailConfig({
        EMAIL_PROVIDER: 'gmail-app-password',
        EMAIL_SEND_ENABLED: 'true',
        GMAIL_APP_PASSWORD: 'must-not-leak',
      }),
    ).toThrow('Missing: EMAIL_FROM, GMAIL_USER');

    try {
      loadEmailConfig({
        EMAIL_PROVIDER: 'gmail-app-password',
        EMAIL_SEND_ENABLED: 'true',
        GMAIL_APP_PASSWORD: 'must-not-leak',
      });
    } catch (error: unknown) {
      expect(String(error)).not.toContain('must-not-leak');
    }
  });

  it('allows incomplete transport credentials while sending is disabled', () => {
    expect(
      loadEmailConfig({
        EMAIL_PROVIDER: 'gmail-app-password',
        EMAIL_SEND_ENABLED: 'false',
      }),
    ).toMatchObject({ provider: 'gmail-app-password', sendEnabled: false });
  });

  it('requires Resend credentials and one QA recipient in test mode', () => {
    expect(() =>
      loadEmailConfig({
        EMAIL_PROVIDER: 'resend',
        NODE_ENV: 'test',
        EMAIL_SEND_ENABLED: 'true',
      }),
    ).toThrow(
      'Missing: EMAIL_FROM, RESEND_API_KEY, RESEND_QA_ALLOWED_RECIPIENT',
    );

    expect(
      loadEmailConfig({
        EMAIL_PROVIDER: 'resend',
        NODE_ENV: 'test',
        EMAIL_SEND_ENABLED: 'true',
        EMAIL_FROM: 'onboarding@resend.dev',
        RESEND_API_KEY: 'resend-api-key-secret',
        RESEND_QA_ALLOWED_RECIPIENT: 'qa.user@example.test',
        RESEND_TIMEOUT_MS: '15000',
      }),
    ).toMatchObject({
      provider: 'resend',
      resendQaAllowedRecipient: 'qa.user@example.test',
      resendTimeoutMs: 15000,
    });
  });

  it('rejects invalid Resend recipient and timeout values', () => {
    expect(() =>
      loadEmailConfig({
        EMAIL_PROVIDER: 'resend',
        NODE_ENV: 'test',
        EMAIL_SEND_ENABLED: 'true',
        EMAIL_FROM: 'onboarding@resend.dev',
        RESEND_API_KEY: 'resend-api-key-secret',
        RESEND_QA_ALLOWED_RECIPIENT: 'not-an-email',
      }),
    ).toThrow('RESEND_QA_ALLOWED_RECIPIENT');
    expect(() => loadEmailConfig({ RESEND_TIMEOUT_MS: '10' })).toThrow(
      'RESEND_TIMEOUT_MS',
    );
  });

  it('does not apply the QA recipient restriction outside test mode', () => {
    expect(
      loadEmailConfig({
        NODE_ENV: 'production',
        EMAIL_PROVIDER: 'resend',
        EMAIL_SEND_ENABLED: 'true',
        EMAIL_FROM: 'notificaciones@curime.example',
        RESEND_API_KEY: 'resend-api-key-secret',
      }),
    ).toMatchObject({
      provider: 'resend',
      resendQaAllowedRecipient: undefined,
    });
  });

  it('rejects Resend test sender in production', () => {
    expect(() =>
      loadEmailConfig({
        NODE_ENV: 'production',
        EMAIL_PROVIDER: 'resend',
        EMAIL_SEND_ENABLED: 'true',
        EMAIL_FROM: 'onboarding@resend.dev',
        RESEND_API_KEY: 'resend-api-key-secret',
      }),
    ).toThrow('onboarding@resend.dev');
  });

  it('rejects invalid provider and boolean values', () => {
    expect(() => loadEmailConfig({ EMAIL_PROVIDER: 'smtp' })).toThrow(
      'EMAIL_PROVIDER',
    );
    expect(() => loadEmailConfig({ EMAIL_SEND_ENABLED: 'yes' })).toThrow(
      'EMAIL_SEND_ENABLED',
    );
  });
});
