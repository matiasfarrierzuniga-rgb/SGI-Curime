import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { getFrontendOrigins } from '../../application/config/frontend-origin.config';

export function assertCookieRequestOrigin(request: Request): void {
  const allowedOrigins = getFrontendOrigins();
  const origin = request.get('origin');
  const referer = request.get('referer');
  const suppliedOrigin = origin ?? originFromReferer(referer);

  if (!suppliedOrigin || !allowedOrigins.includes(suppliedOrigin)) {
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
