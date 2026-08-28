import { assertSafeSubject, type RenderedEmailTemplate } from '../template';
import { renderEmailLayout } from './email-layout';

export interface PasswordResetTemplateData {
  readonly recipientName: string;
  readonly resetUrl: string;
}

export function passwordResetTemplate(
  data: PasswordResetTemplateData,
): RenderedEmailTemplate {
  const subject = assertSafeSubject('Restablezca su contraseña de SGI-Curime');
  return {
    subject,
    html: renderEmailLayout({
      greetingName: data.recipientName,
      heading: 'Restablecimiento de contraseña',
      body: 'Recibimos una solicitud para restablecer su contraseña. Use el siguiente enlace para continuar.',
      ctaLabel: 'Restablecer contraseña',
      ctaUrl: data.resetUrl,
    }),
    text: `Hola, ${data.recipientName}:\n\nRecibimos una solicitud para restablecer su contraseña. Use el siguiente enlace para continuar:\n${data.resetUrl}\n\nAsociación de Desarrollo Integral de Curime`,
  };
}
