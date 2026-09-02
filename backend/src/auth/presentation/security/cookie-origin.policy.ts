import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { getFrontendOrigin } from '../../application/config/frontend-origin.config';

export function assertCookieRequestOrigin(request: Request): void {
  const expectedOrigin = getFrontendOrigin();
  const origin = request.get('origin');
  const referer = request.get('referer');
  const suppliedOrigin = origin ?? originFromReferer(referer);

  if (suppliedOrigin !== expectedOrigin) {
    throw new ForbiddenException('Forbidden');
  }
}

function originFromReferer(referer: string | undefined): string | undefined {
  if (!referer) return undefined;
  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
}
