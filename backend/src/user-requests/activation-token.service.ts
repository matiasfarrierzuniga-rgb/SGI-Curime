import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

export type GeneratedActivationToken = {
  token: string;
  tokenHash: string;
  expiresAt: Date;
};

@Injectable()
export class ActivationTokenService {
  generate(): GeneratedActivationToken {
    const configuredHours = Number(
      process.env.ACTIVATION_TOKEN_TTL_HOURS ?? 24,
    );
    const ttlHours =
      Number.isFinite(configuredHours) && configuredHours > 0
        ? configuredHours
        : 24;
    const token = randomBytes(32).toString('base64url');

    return {
      token,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
    };
  }
}
