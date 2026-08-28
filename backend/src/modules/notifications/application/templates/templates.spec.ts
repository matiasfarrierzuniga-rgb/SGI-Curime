import { accountActivationTemplate } from './account-activation.template';
import { passwordChangedTemplate } from './password-changed.template';
import { passwordResetTemplate } from './password-reset.template';

describe('notification templates', () => {
  const maliciousName = '<script>alert(1)</script>';

  it('escapes dynamic HTML and includes plain text and activation CTA', () => {
    const template = accountActivationTemplate({
      recipientName: maliciousName,
      activationUrl: 'https://example.test/activate-account?token=secret-token',
      expiresAt: new Date('2026-08-28T18:00:00.000Z'),
    });

    expect(template.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(template.html).not.toContain('<script>alert(1)</script>');
    expect(template.html).toContain('Activar cuenta');
    expect(template.html).toContain('solicitud fue aprobada');
    expect(template.html).toContain('28 de agosto de 2026');
    expect(template.text).toContain(maliciousName);
    expect(template.subject).not.toContain('secret-token');
  });

  it('renders password reset HTML, plain text, and the correct CTA', () => {
    const template = passwordResetTemplate({
      recipientName: 'María',
      resetUrl: 'https://example.test/reset-password?token=reset-token',
    });

    expect(template.html).toContain('Restablecer contraseña');
    expect(template.text).toContain('/reset-password?token=reset-token');
    expect(template.subject).not.toContain('reset-token');
  });

  it('renders a password-changed notice without token or invented contact data', () => {
    const template = passwordChangedTemplate({ recipientName: 'María' });

    expect(template.html).toContain('canales oficiales');
    expect(template.text).toContain('canales oficiales');
    expect(template.html).not.toContain('token');
    expect(template.subject).toBe('Su contraseña de SGI-Curime fue modificada');
  });
});
