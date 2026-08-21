import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import {
  AUTH_REPOSITORY,
  type AuthRepository,
} from '../ports/auth-repository.port';
import {
  PASSWORD_RESET_DELIVERY_PORT,
  type PasswordResetDeliveryPort,
} from '../ports/password-reset-delivery.port';

const GENERIC_RESPONSE =
  'If the email is registered, password reset instructions will be sent.';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getResetTtlMinutes(): number {
  const raw = process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES?.trim();
  const value = Number(raw);
  if (!raw || !Number.isInteger(value) || value <= 0) {
    throw new Error(
      'PASSWORD_RESET_TOKEN_TTL_MINUTES must be configured as a positive integer.',
    );
  }
  return value;
}

@Injectable()
export class RequestPasswordResetUseCase {
  private readonly ttlMinutes = getResetTtlMinutes();

  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repository: AuthRepository,
    @Inject(PASSWORD_RESET_DELIVERY_PORT)
    private readonly delivery: PasswordResetDeliveryPort,
  ) {}

  async execute(email: string): Promise<{ message: string }> {
    const user = await this.repository.findCredentialsByEmail(email);
    if (!user) return { message: GENERIC_RESPONSE };

    const token = randomBytes(32).toString('base64url');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ttlMinutes * 60_000);

    await this.repository.invalidateAndCreateResetToken(
      user.id,
      hashToken(token),
      expiresAt,
    );

    await this.delivery.deliver({
      email: user.email,
      fullName: user.fullName,
      token,
      expiresAt,
    });

    return { message: GENERIC_RESPONSE };
  }
}
