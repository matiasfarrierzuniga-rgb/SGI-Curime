import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { EmailDeliveryErrorKind } from '../application/errors/email-delivery.error';
import type { EmailMessage } from '../domain/email-message';
import {
  GmailAppPasswordEmailProvider,
  type GmailTransportFactory,
} from './gmail-app-password-email.provider';

const config = {
  from: 'notificaciones@example.test',
  fromName: 'Asociación de Desarrollo Integral de Curime',
  replyTo: 'contacto@example.test',
  user: 'gmail-user@example.test',
  appPassword: 'private-app-password',
};

const message: EmailMessage = {
  to: 'persona@example.test',
  from: 'attacker@example.test',
  replyTo: 'attacker@example.test',
  subject: 'Mensaje seguro',
  html: '<p>Contenido</p>',
  text: 'Contenido',
};

function createHarness() {
  const sendMail = jest.fn().mockResolvedValue({
    messageId: '<provider-id@example.test>',
    accepted: ['persona@example.test'],
  });
  const transportFactory: jest.MockedFunction<GmailTransportFactory> = jest.fn(
    (options: SMTPTransport.Options) => {
      void options;
      return {
        sendMail,
      } as unknown as Transporter<SMTPTransport.SentMessageInfo>;
    },
  );
  const provider = new GmailAppPasswordEmailProvider(config, transportFactory);
  return { provider, sendMail, transportFactory };
}

describe('GmailAppPasswordEmailProvider', () => {
  it('configures Gmail SMTP with STARTTLS and the App Password', () => {
    const { transportFactory } = createHarness();

    expect(transportFactory).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: 'gmail-user@example.test',
        pass: 'private-app-password',
      },
    });
  });

  it('uses configured sender and reply-to, sends mail, and maps messageId', async () => {
    const { provider, sendMail } = createHarness();

    await expect(provider.send(message)).resolves.toEqual({
      messageId: '<provider-id@example.test>',
      accepted: true,
    });
    expect(sendMail).toHaveBeenCalledWith({
      to: 'persona@example.test',
      from: {
        name: 'Asociación de Desarrollo Integral de Curime',
        address: 'notificaciones@example.test',
      },
      replyTo: 'contacto@example.test',
      subject: 'Mensaje seguro',
      html: '<p>Contenido</p>',
      text: 'Contenido',
    });
  });

  it('omits reply-to when it is not configured', async () => {
    const { sendMail, transportFactory } = createHarness();
    const provider = new GmailAppPasswordEmailProvider(
      { ...config, replyTo: undefined },
      transportFactory,
    );

    await provider.send(message);

    expect(sendMail).toHaveBeenLastCalledWith(
      expect.objectContaining({ replyTo: undefined }),
    );
  });

  it('maps authentication errors without leaking the App Password', async () => {
    const { provider, sendMail } = createHarness();
    sendMail.mockRejectedValue({
      code: 'EAUTH',
      responseCode: 535,
      message: `Authentication failed: ${config.appPassword}`,
    });

    await expect(provider.send(message)).rejects.toMatchObject({
      kind: EmailDeliveryErrorKind.CONFIGURATION,
    });
    await provider.send(message).catch((error: unknown) => {
      expect(String(error)).not.toContain(config.appPassword);
    });
  });

  it.each([
    [{ code: 'ETIMEDOUT' }, EmailDeliveryErrorKind.TEMPORARY],
    [{ responseCode: 421 }, EmailDeliveryErrorKind.TEMPORARY],
    [{ responseCode: 550 }, EmailDeliveryErrorKind.PERMANENT],
  ])('maps SMTP failure %# to %s', async (failure, kind) => {
    const { provider, sendMail } = createHarness();
    sendMail.mockRejectedValue(failure);

    await expect(provider.send(message)).rejects.toMatchObject({ kind });
  });
});
