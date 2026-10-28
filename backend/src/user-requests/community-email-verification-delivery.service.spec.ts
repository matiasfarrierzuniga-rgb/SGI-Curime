import { Logger } from '@nestjs/common';
import { NotificationEventType } from '../modules/notifications/domain/notification-event';
import { CommunityEmailVerificationDeliveryService } from './community-email-verification-delivery.service';

describe('CommunityEmailVerificationDeliveryService', () => {
  const notifications = { send: jest.fn() };
  const delivery = {
    userId: 7,
    email: 'community@example.test',
    fullName: 'Persona',
    token: 'raw-token',
    expiresAt: new Date('2026-10-25T10:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    notifications.send.mockResolvedValue({
      messageId: 'fake-1',
      accepted: true,
    });
  });

  it('uses the dedicated community verification event', async () => {
    await expect(
      new CommunityEmailVerificationDeliveryService(
        notifications as never,
      ).deliver(delivery),
    ).resolves.toBe(true);
    expect(notifications.send).toHaveBeenCalledWith({
      type: NotificationEventType.COMMUNITY_EMAIL_VERIFICATION,
      userId: delivery.userId,
      to: delivery.email,
      recipientName: delivery.fullName,
      token: delivery.token,
      expiresAt: delivery.expiresAt,
    });
  });

  it('does not leak provider detail when delivery fails', async () => {
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    notifications.send.mockRejectedValue(new Error('SMTP secret raw-token'));
    await expect(
      new CommunityEmailVerificationDeliveryService(
        notifications as never,
      ).deliver(delivery),
    ).resolves.toBe(false);
    expect(log.mock.calls.flat().join(' ')).not.toContain('raw-token');
  });
});
