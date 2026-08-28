import { assertSafeSubject, type RenderedEmailTemplate } from '../template';
import { renderEmailLayout } from './email-layout';

export interface AccountActivationTemplateData {
  readonly recipientName: string;
  readonly activationUrl: string;
  readonly expiresAt: Date;
}

export function accountActivationTemplate(
  data: AccountActivationTemplateData,
): RenderedEmailTemplate {
  const subject = assertSafeSubject('Active su cuenta en SGI-Curime');
  const expiration = new Intl.DateTimeFormat('es-CR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Costa_Rica',
  }).format(data.expiresAt);
  const notice = `Su solicitud fue aprobada. Active su cuenta antes del ${expiration}.`;
  return {
    subject,
    html: renderEmailLayout({
      greetingName: data.recipientName,
      heading: 'Activación de cuenta',
      body: notice,
      ctaLabel: 'Activar cuenta',
      ctaUrl: data.activationUrl,
    }),
    text: `Hola, ${data.recipientName}:\n\n${notice}\n\nActivar cuenta:\n${data.activationUrl}\n\nAsociación de Desarrollo Integral de Curime`,
  };
}
