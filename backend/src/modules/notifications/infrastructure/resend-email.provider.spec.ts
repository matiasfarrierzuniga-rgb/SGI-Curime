import { EmailDeliveryErrorKind } from '../application/errors/email-delivery.error';
import type { EmailMessage } from '../domain/email-message';
import {
  mapResendHttpError,
  ResendEmailProvider,
  type ResendHttpClient,
} from './resend-email.provider';

const config = {
  apiKey: 'resend-api-key-secret',
  from: 'onboarding@resend.dev',
  fromName: 'Asociación de Desarrollo Integral de Curime',
  replyTo: 'contacto@example.test',
  qaAllowedRecipient: 'qa.user@example.test',
  timeoutMs: 1_000,
};

const message: EmailMessage = {
  to: 'qa.user@example.test',
  subject: 'Verifique su correo',
  html: '<p>Contenido</p>',
  text: 'Contenido',
  idempotencyKey: 'community-verification-1',
};

function createHarness() {
  const httpClient: jest.MockedFunction<ResendHttpClient> = jest.fn();
  const provider = new ResendEmailProvider(config, httpClient);
  return { provider, httpClient };
}

describe('ResendEmailProvider', () => {
  it('sends only to the configured QA recipient with safe Resend request data', async () => {
    const { provider, httpClient } = createHarness();
    httpClient.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ id: 'resend-message-id' }),
    });

    await expect(provider.send(message)).resolves.toEqual({
      messageId: 'resend-message-id',
      accepted: true,
    });
    expect(httpClient).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${config.apiKey}`,
          'Idempotency-Key': 'community-verification-1',
        }),
      }),
    );
    const request = httpClient.mock.calls[0][1];
    expect(JSON.parse(String(request.body))).toEqual({
      from: 'Asociación de Desarrollo Integral de Curime <onboarding@resend.dev>',
      to: ['qa.user@example.test'],
      reply_to: 'contacto@example.test',
      subject: 'Verifique su correo',
      html: '<p>Contenido</p>',
      text: 'Contenido',
    });
  });

  it('rejects non-authorized recipients before making an HTTP request', async () => {
    const { provider, httpClient } = createHarness();

    await expect(
      provider.send({ ...message, to: 'other@example.test' }),
    ).rejects.toMatchObject({ kind: EmailDeliveryErrorKind.PERMANENT });
    expect(httpClient).not.toHaveBeenCalled();
  });

  it('does not impose a QA recipient restriction when none is configured', async () => {
    const { httpClient } = createHarness();
    httpClient.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ id: 'resend-message-id' }),
    });
    const provider = new ResendEmailProvider(
      {
        ...config,
        qaAllowedRecipient: undefined,
      },
      httpClient,
    );

    await expect(
      provider.send({ ...message, to: 'neighbor@example.test' }),
    ).resolves.toMatchObject({ accepted: true });
  });

  it('maps Resend HTTP failures without exposing the API key', async () => {
    const { provider, httpClient } = createHarness();
    httpClient.mockResolvedValue({
      ok: false,
      status: 401,
      json: jest.fn(),
    });

    await expect(provider.send(message)).rejects.toMatchObject({
      kind: EmailDeliveryErrorKind.CONFIGURATION,
    });
    await provider.send(message).catch((error: unknown) => {
      expect(String(error)).not.toContain(config.apiKey);
    });
  });

  it.each([
    [400, EmailDeliveryErrorKind.PERMANENT],
    [403, EmailDeliveryErrorKind.CONFIGURATION],
    [429, EmailDeliveryErrorKind.TEMPORARY],
    [500, EmailDeliveryErrorKind.TEMPORARY],
  ])('maps HTTP %i to %s', (status, kind) => {
    expect(mapResendHttpError(status)).toMatchObject({ kind });
  });

  it('maps aborted transport requests to a sanitized temporary error', async () => {
    const { provider, httpClient } = createHarness();
    httpClient.mockRejectedValue({ name: 'AbortError' });

    await expect(provider.send(message)).rejects.toMatchObject({
      kind: EmailDeliveryErrorKind.TEMPORARY,
      message: 'Resend email delivery timed out.',
    });
  });
});
