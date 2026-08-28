import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { NotificationEventType } from '../modules/notifications/domain/notification-event';
import { ActivationTokenDeliveryService } from './activation-token-delivery.service';

describe('ActivationTokenDeliveryService', () => {
  const notifications = { send: jest.fn() };
  const delivery = {
    userId: 22,
    email: 'persona@example.test',
    fullName: 'Persona <Curime>',
    token: 'raw-activation-token',
    expiresAt: new Date('2026-08-28T18:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    notifications.send.mockResolvedValue({
      messageId: 'fake-1',
      accepted: true,
    });
  });

  it('delivers the activation intent with only the required in-memory data', async () => {
    await new ActivationTokenDeliveryService(notifications as never).deliver(
      delivery,
    );

    expect(notifications.send).toHaveBeenCalledWith({
      type: NotificationEventType.ACCOUNT_ACTIVATION_REQUESTED,
      userId: delivery.userId,
      to: delivery.email,
      recipientName: delivery.fullName,
      token: delivery.token,
      expiresAt: delivery.expiresAt,
    });
  });

  it('logs a sanitized operational error and exposes no provider details', async () => {
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    notifications.send.mockRejectedValue(
      new Error('SMTP auth failed: secret-token app-password'),
    );

    await expect(
      new ActivationTokenDeliveryService(notifications as never).deliver(
        delivery,
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(log).toHaveBeenCalledWith(expect.stringContaining('userId=22'));
    expect(log.mock.calls.flat().join(' ')).not.toContain(delivery.token);
    expect(log.mock.calls.flat().join(' ')).not.toContain('app-password');
  });
});
