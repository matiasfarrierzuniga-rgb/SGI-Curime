import { assertSafeSubject, type RenderedEmailTemplate } from '../template';
import { renderEmailLayout } from './email-layout';

export interface PasswordChangedTemplateData {
  readonly recipientName: string;
}

const NOTICE =
  'Su contraseña fue modificada. Si no reconoce este cambio, contacte a la Asociación mediante sus canales oficiales.';

export function passwordChangedTemplate(
  data: PasswordChangedTemplateData,
): RenderedEmailTemplate {
  const subject = assertSafeSubject(
    'Su contraseña de SGI-Curime fue modificada',
  );
  return {
    subject,
    html: renderEmailLayout({
      greetingName: data.recipientName,
      heading: 'Contraseña modificada',
      body: NOTICE,
    }),
    text: `Hola, ${data.recipientName}:\n\n${NOTICE}\n\nAsociación de Desarrollo Integral de Curime`,
  };
}
