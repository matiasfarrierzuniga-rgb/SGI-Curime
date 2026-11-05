import { assertSafeSubject, type RenderedEmailTemplate } from '../template';
import { renderEmailLayout } from './email-layout';

export interface CommunityEmailVerificationTemplateData {
  readonly recipientName: string;
  readonly verificationUrl: string;
  readonly expiresAt: Date;
}

export function communityEmailVerificationTemplate(
  data: CommunityEmailVerificationTemplateData,
): RenderedEmailTemplate {
  const subject = assertSafeSubject(
    'Verifique su correo para completar su cuenta comunitaria',
  );
  const expiration = new Intl.DateTimeFormat('es-CR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Costa_Rica',
  }).format(data.expiresAt);
  const notice = `Para completar su cuenta comunitaria, verifique que controla este correo antes del ${expiration}.`;
  return {
    subject,
    html: renderEmailLayout({
      greetingName: data.recipientName,
      heading: 'Verificación de correo',
      body: notice,
      ctaLabel: 'Verificar correo',
      ctaUrl: data.verificationUrl,
    }),
    text: `Hola, ${data.recipientName}:\n\n${notice}\n\nVerificar correo:\n${data.verificationUrl}\n\nAsociación de Desarrollo Integral de Curime`,
  };
}
