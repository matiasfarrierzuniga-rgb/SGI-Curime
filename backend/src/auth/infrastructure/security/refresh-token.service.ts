import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import type { RefreshTokenPort } from '../../application/ports/refresh-token.port';

@Injectable()
export class RefreshTokenService implements RefreshTokenPort {
  generate(): string {
    return randomBytes(32).toString('base64url');
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
