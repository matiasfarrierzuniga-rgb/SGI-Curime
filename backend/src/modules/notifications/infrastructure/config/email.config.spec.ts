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

  it('rejects invalid provider and boolean values', () => {
    expect(() => loadEmailConfig({ EMAIL_PROVIDER: 'smtp' })).toThrow(
      'EMAIL_PROVIDER',
    );
    expect(() => loadEmailConfig({ EMAIL_SEND_ENABLED: 'yes' })).toThrow(
      'EMAIL_SEND_ENABLED',
    );
  });
});
