import { PasswordResetTokenDeliveryService } from './password-reset-token-delivery.service';

describe('password reset delivery', () => {
  it('uses the existing notification service without exposing provider errors', async () => {
    const notifications = {
      send: jest.fn().mockResolvedValue({ accepted: true }),
    };
    const service = new PasswordResetTokenDeliveryService(
      notifications as never,
    );
    const delivery = {
      email: 'synthetic@example.test',
      fullName: 'Synthetic',
      token: 'test-token',
      expiresAt: new Date(),
    };
    await service.deliver(delivery);
    expect(notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: delivery.email,
        recipientName: delivery.fullName,
        token: delivery.token,
      }),
    );
    notifications.send.mockRejectedValueOnce(new Error('provider error'));
    await expect(service.deliver(delivery)).resolves.toBeUndefined();
  });
});
