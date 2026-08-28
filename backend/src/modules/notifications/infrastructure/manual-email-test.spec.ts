import type { EmailProvider } from '../application/ports/email-provider.port';
import type { EmailMessage } from '../domain/email-message';
import type { NotificationEnvironment } from './config/email.config';
import {
  runManualEmailTest,
  sanitizeManualEmailError,
  validateRecipient,
} from './manual-email-test';

const validEnvironment = {
  EMAIL_PROVIDER: 'gmail-app-password',
  EMAIL_SEND_ENABLED: 'true',
  EMAIL_FROM: 'notificaciones@example.test',
  EMAIL_FROM_NAME: 'Asociación de Desarrollo Integral de Curime',
  GMAIL_USER: 'gmail-user@example.test',
  GMAIL_APP_PASSWORD: 'app-password-secret',
};

function createHarness(
  environment: NotificationEnvironment = validEnvironment,
) {
  const send = jest
    .fn<Promise<{ messageId: string; accepted: boolean }>, [EmailMessage]>()
    .mockResolvedValue({ messageId: 'mock-id', accepted: true });
  const provider: EmailProvider = { send };
  const providerFactory = jest.fn(() => provider);
  const logger = { info: jest.fn<void, [string]>() };
  return { environment, logger, providerFactory, send };
}

describe('manual email test', () => {
  it.each([
    undefined,
    '',
    'invalid',
    'missing-domain@',
    'line@example.test\r\nBcc:x@example.test',
  ])('rejects invalid recipient %p', (recipient) => {
    expect(() => validateRecipient(recipient)).toThrow('valid recipient');
  });

  it('refuses delivery when EMAIL_SEND_ENABLED is false without creating a provider', async () => {
    const harness = createHarness({
      ...validEnvironment,
      EMAIL_SEND_ENABLED: 'false',
    });

    await expect(
      runManualEmailTest({
        recipient: 'recipient@example.test',
        ...harness,
      }),
    ).rejects.toThrow('EMAIL_SEND_ENABLED must be true');
    expect(harness.providerFactory).not.toHaveBeenCalled();
    expect(harness.send).not.toHaveBeenCalled();
  });

  it('refuses delivery for a non-Gmail provider', async () => {
    const harness = createHarness({
      ...validEnvironment,
      EMAIL_PROVIDER: 'fake',
    });

    await expect(
      runManualEmailTest({
        recipient: 'recipient@example.test',
        ...harness,
      }),
    ).rejects.toThrow('EMAIL_PROVIDER must be gmail-app-password');
    expect(harness.providerFactory).not.toHaveBeenCalled();
  });

  it('fails with variable names when required configuration is missing', async () => {
    const harness = createHarness({
      EMAIL_PROVIDER: 'gmail-app-password',
      EMAIL_SEND_ENABLED: 'true',
      GMAIL_APP_PASSWORD: 'must-not-leak',
    });

    await expect(
      runManualEmailTest({
        recipient: 'recipient@example.test',
        ...harness,
      }),
    ).rejects.toThrow('Missing: EMAIL_FROM, GMAIL_USER');
    expect(harness.providerFactory).not.toHaveBeenCalled();
  });

  it('sends one innocuous message only when explicitly called', async () => {
    const harness = createHarness();

    await runManualEmailTest({
      recipient: 'recipient@example.test',
      ...harness,
    });

    expect(harness.send).toHaveBeenCalledTimes(1);
    const sent = harness.send.mock.calls[0][0];
    expect(sent.to).toBe('recipient@example.test');
    expect(sent.subject).toBe('Prueba de correo SGI-Curime');
    expect(sent.html).toContain('correo de prueba');
    expect(sent.text).toContain('correo de prueba');
  });

  it('sanitizes unexpected errors without exposing their content', () => {
    expect(sanitizeManualEmailError(new Error('app-password-secret'))).toBe(
      'Manual email test failed unexpectedly.',
    );
  });
});
