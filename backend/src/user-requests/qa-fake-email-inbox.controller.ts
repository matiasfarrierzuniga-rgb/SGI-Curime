import { Controller, Get, NotFoundException, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { FakeEmailProvider } from '../modules/notifications/infrastructure/fake-email.provider';

const COMMUNITY_VERIFICATION_PATH = '/verify-community-email?token=';

@Controller('qa/fake-email')
export class QaFakeEmailInboxController {
  constructor(private readonly emails: FakeEmailProvider) {}

  @Get('community-verification')
  latestCommunityVerification(
    @Query('email') email: string | undefined,
    @Req() request: Request,
  ) {
    this.assertEnabled(request);
    const message = [...this.emails.getMessages()]
      .reverse()
      .find(
        (candidate) =>
          candidate.text.includes(COMMUNITY_VERIFICATION_PATH) &&
          (!email || candidate.to.toLowerCase() === email.toLowerCase()),
      );
    if (!message)
      throw new NotFoundException('No hay correo comunitario simulado.');

    const verificationUrl = message.text
      .split(/\s+/)
      .find((value) => value.includes(COMMUNITY_VERIFICATION_PATH));
    if (!verificationUrl)
      throw new NotFoundException(
        'El correo simulado no contiene enlace de verificación.',
      );

    return { to: message.to, verificationUrl };
  }

  private assertEnabled(request: Request) {
    if (
      process.env.NODE_ENV !== 'test' ||
      process.env.QA_FAKE_EMAIL_INBOX_ENABLED !== 'true' ||
      process.env.EMAIL_PROVIDER !== 'fake' ||
      !isLoopback(request.socket.remoteAddress)
    ) {
      throw new NotFoundException();
    }
  }
}

function isLoopback(address: string | undefined) {
  return (
    address === '127.0.0.1' ||
    address === '::1' ||
    address === '::ffff:127.0.0.1'
  );
}
