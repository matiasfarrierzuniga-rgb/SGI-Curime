import { NotFoundException } from '@nestjs/common';
import { QaFakeEmailInboxController } from './qa-fake-email-inbox.controller';

describe('QaFakeEmailInboxController', () => {
  const original = { ...process.env };
  const emails = { getMessages: jest.fn() };

  beforeEach(() => {
    process.env = {
      ...original,
      NODE_ENV: 'test',
      QA_FAKE_EMAIL_INBOX_ENABLED: 'true',
      EMAIL_PROVIDER: 'fake',
    };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = original;
  });

  it('returns only newest matching community verification link in explicit test harness mode', () => {
    emails.getMessages.mockReturnValue([
      {
        to: 'old@example.test',
        text: 'Abra http://localhost:5174/verify-community-email?token=old',
      },
      {
        to: 'qa@example.test',
        text: 'Abra http://localhost:5174/verify-community-email?token=current',
      },
    ]);
    const controller = new QaFakeEmailInboxController(emails as never);

    expect(
      controller.latestCommunityVerification('qa@example.test', {
        socket: { remoteAddress: '127.0.0.1' },
      } as never),
    ).toEqual({
      to: 'qa@example.test',
      verificationUrl:
        'http://localhost:5174/verify-community-email?token=current',
    });
  });

  it('is unavailable outside explicit test harness mode', () => {
    process.env.QA_FAKE_EMAIL_INBOX_ENABLED = 'false';
    const controller = new QaFakeEmailInboxController(emails as never);

    expect(() =>
      controller.latestCommunityVerification(undefined, {
        socket: { remoteAddress: '127.0.0.1' },
      } as never),
    ).toThrow(NotFoundException);
  });

  it('rejects non-loopback callers even when test harness mode is enabled', () => {
    const controller = new QaFakeEmailInboxController(emails as never);

    expect(() =>
      controller.latestCommunityVerification(undefined, {
        socket: { remoteAddress: '192.168.1.10' },
      } as never),
    ).toThrow(NotFoundException);
  });
});
