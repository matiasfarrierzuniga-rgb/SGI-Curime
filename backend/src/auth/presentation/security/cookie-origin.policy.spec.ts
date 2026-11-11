import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { assertCookieRequestOrigin } from './cookie-origin.policy';

const originalNodeEnv = process.env.NODE_ENV;
const originalFrontendUrl = process.env.FRONTEND_URL;

function requestWith(
  headers: Record<string, string | undefined>,
): Request {
  return {
    get: (name: string) => headers[name.toLowerCase()],
  } as unknown as Request;
}

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalFrontendUrl === undefined) delete process.env.FRONTEND_URL;
  else process.env.FRONTEND_URL = originalFrontendUrl;
});

describe('cookie request origin policy', () => {
  describe('development', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      process.env.FRONTEND_URL = 'http://localhost:5174';
    });

    it('accepts the configured localhost origin', () => {
      expect(() =>
        assertCookieRequestOrigin(
          requestWith({ origin: 'http://localhost:5174' }),
        ),
      ).not.toThrow();
    });

    it('accepts the 127.0.0.1 loopback alias', () => {
      expect(() =>
        assertCookieRequestOrigin(
          requestWith({ origin: 'http://127.0.0.1:5174' }),
        ),
      ).not.toThrow();
    });

    it('accepts the 127.0.0.1 alias from Referer when Origin is absent', () => {
      expect(() =>
        assertCookieRequestOrigin(
          requestWith({ referer: 'http://127.0.0.1:5174/login' }),
        ),
      ).not.toThrow();
    });

    it('rejects an external origin', () => {
      expect(() =>
        assertCookieRequestOrigin(
          requestWith({ origin: 'https://evil.example' }),
        ),
      ).toThrow(ForbiddenException);
    });

    it('rejects a loopback origin with a different port', () => {
      expect(() =>
        assertCookieRequestOrigin(
          requestWith({ origin: 'http://127.0.0.1:5175' }),
        ),
      ).toThrow(ForbiddenException);
    });

    it('rejects a request without Origin or Referer', () => {
      expect(() => assertCookieRequestOrigin(requestWith({}))).toThrow(
        ForbiddenException,
      );
    });

    it('rejects an invalid Referer', () => {
      expect(() =>
        assertCookieRequestOrigin(requestWith({ referer: 'not-a-url' })),
      ).toThrow(ForbiddenException);
    });
  });

  describe('production', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.FRONTEND_URL = 'https://app.example.com';
    });

    it('accepts only the configured origin', () => {
      expect(() =>
        assertCookieRequestOrigin(
          requestWith({ origin: 'https://app.example.com' }),
        ),
      ).not.toThrow();
    });

    it('rejects the localhost alias', () => {
      expect(() =>
        assertCookieRequestOrigin(
          requestWith({ origin: 'http://localhost:5174' }),
        ),
      ).toThrow(ForbiddenException);
    });

    it('rejects an external origin', () => {
      expect(() =>
        assertCookieRequestOrigin(
          requestWith({ origin: 'https://evil.example' }),
        ),
      ).toThrow(ForbiddenException);
    });
  });
});
