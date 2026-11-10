import type { CookieOptions } from 'express';

const DEVELOPMENT_COOKIE_NAME = 'sgi_refresh';
const PRODUCTION_COOKIE_NAME = '__Host-sgi_refresh';

export interface RefreshCookiePolicy {
  name: string;
  options: CookieOptions;
}

export function getRefreshTokenTtlSeconds(): number {
  const raw = process.env.REFRESH_TOKEN_TTL?.trim();
  const value = Number(raw);
  if (!raw || !Number.isInteger(value) || value <= 0) {
    throw new Error(
      'REFRESH_TOKEN_TTL must be configured as a positive integer of seconds.',
    );
  }
  return value;
}

export function getRefreshCookiePolicy(expiresAt?: Date): RefreshCookiePolicy {
  const sameSite = parseSameSite(process.env.REFRESH_COOKIE_SAME_SITE);
  const secure = process.env.NODE_ENV === 'production' || sameSite === 'none';
  const production = process.env.NODE_ENV === 'production';
  const configuredName = process.env.REFRESH_COOKIE_NAME?.trim();
  const name = production
    ? productionCookieName(configuredName)
    : configuredName || DEVELOPMENT_COOKIE_NAME;

  if (name.startsWith('__Host-') && (!secure || sameSite === 'none')) {
    throw new Error(
      'A __Host- refresh cookie requires Secure=true and an approved same-site policy.',
    );
  }
  if (name.startsWith('__Secure-') && !secure) {
    throw new Error('A __Secure- refresh cookie requires Secure=true.');
  }

  const configuredMaxAge = getRefreshTokenTtlSeconds() * 1000;
  const maxAge = expiresAt
    ? Math.min(configuredMaxAge, expiresAt.getTime() - Date.now())
    : configuredMaxAge;
  if (!Number.isFinite(maxAge) || maxAge <= 0) {
    throw new Error('Cannot issue a refresh cookie for an expired session.');
  }

  return {
    name,
    options: {
      httpOnly: true,
      path: '/',
      secure,
      sameSite,
      maxAge,
      expires: expiresAt,
    },
  };
}

function productionCookieName(configuredName: string | undefined): string {
  if (configuredName && configuredName !== PRODUCTION_COOKIE_NAME) {
    throw new Error(
      `Production refresh cookie must be named ${PRODUCTION_COOKIE_NAME}.`,
    );
  }
  return PRODUCTION_COOKIE_NAME;
}

function parseSameSite(value: string | undefined): CookieOptions['sameSite'] {
  const sameSite = value?.trim().toLowerCase() || 'lax';
  if (sameSite === 'lax' || sameSite === 'strict' || sameSite === 'none') {
    return sameSite;
  }
  throw new Error(
    'REFRESH_COOKIE_SAME_SITE must be lax, strict, or none when configured.',
  );
}
