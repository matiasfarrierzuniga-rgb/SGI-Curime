import { FakeEmailProvider } from '../infrastructure/fake-email.provider';
import {
  NotificationCategory,
  NotificationEventType,
} from '../domain/notification-event';
import { NotificationService } from './notification.service';
import { NotificationUrlBuilder } from './notification-url-builder';

describe('NotificationService', () => {
  let provider: FakeEmailProvider;
  let service: NotificationService;

  beforeEach(() => {
    provider = new FakeEmailProvider();
    service = new NotificationService(
      provider,
      new NotificationUrlBuilder({ baseUrl: 'https://sgi.example.test' }),
    );
  });

  it.each([
    [
      NotificationEventType.ACCOUNT_ACTIVATION_REQUESTED,
      NotificationCategory.SECURITY,
    ],
    [
      NotificationEventType.PASSWORD_RESET_REQUESTED,
      NotificationCategory.SECURITY,
    ],
    [NotificationEventType.PASSWORD_CHANGED, NotificationCategory.SECURITY],
    [
      NotificationEventType.USER_REQUEST_APPROVED,
      NotificationCategory.OPERATIONAL,
    ],
    [
      NotificationEventType.USER_REQUEST_REJECTED,
      NotificationCategory.OPERATIONAL,
    ],
    [
      NotificationEventType.AFFILIATE_REQUEST_APPROVED,
      NotificationCategory.OPERATIONAL,
    ],
    [
      NotificationEventType.AFFILIATE_REQUEST_REJECTED,
      NotificationCategory.OPERATIONAL,
    ],
    [
      NotificationEventType.CONTACT_REQUEST_RECEIVED,
      NotificationCategory.INFORMATIONAL,
    ],
  ])('classifies %s as %s', (type, category) => {
    expect(service.categoryOf(type)).toBe(category);
  });

  it('selects the account activation template and sends HTML and text', async () => {
    await service.send({
      type: NotificationEventType.ACCOUNT_ACTIVATION_REQUESTED,
      to: 'persona@example.test',
      recipientName: 'Persona',
      token: 'activation-token',
      expiresAt: new Date('2026-08-28T18:00:00.000Z'),
    });

    const sent = provider.getMessages()[0];
    expect(sent.subject).toBe('Active su cuenta en SGI-Curime');
    expect(sent.html).toContain('Activación de cuenta');
    expect(sent.text).toContain('activate-account?token=activation-token');
  });

  it('selects the password reset template', async () => {
    await service.send({
      type: NotificationEventType.PASSWORD_RESET_REQUESTED,
      to: 'persona@example.test',
      recipientName: 'Persona',
      token: 'reset-token',
    });

    const sent = provider.getMessages()[0];
    expect(sent.subject).toBe('Restablezca su contraseña de SGI-Curime');
    expect(sent.html).toContain('Restablecimiento de contraseña');
    expect(sent.text).toContain('reset-password?token=reset-token');
  });

  it('selects the password changed template without a token', async () => {
    await service.send({
      type: NotificationEventType.PASSWORD_CHANGED,
      to: 'persona@example.test',
      recipientName: 'Persona',
    });

    const sent = provider.getMessages()[0];
    expect(sent.subject).toBe('Su contraseña de SGI-Curime fue modificada');
    expect(sent.html).toBeTruthy();
    expect(sent.text).toBeTruthy();
    expect(sent.html).not.toContain('token');
  });
});
