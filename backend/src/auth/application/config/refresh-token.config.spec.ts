import { getRefreshCookiePolicy } from './refresh-token.config';

describe('refresh cookie policy', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.REFRESH_TOKEN_TTL = '3600';
    process.env.REFRESH_COOKIE_SAME_SITE = 'lax';
    delete process.env.REFRESH_COOKIE_NAME;
    jest.useFakeTimers().setSystemTime(new Date('2026-09-01T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  });

  it('uses configured TTL for a new login cookie', () => {
    expect(getRefreshCookiePolicy().options).toMatchObject({
      maxAge: 3_600_000,
      path: '/',
      httpOnly: true,
    });
  });

  it('caps a rotated cookie at remaining absolute session lifetime', () => {
    const expiresAt = new Date('2026-09-01T12:10:00.000Z');

    expect(getRefreshCookiePolicy(expiresAt).options).toMatchObject({
      maxAge: 600_000,
      expires: expiresAt,
    });
  });

  it('rejects replacement cookies for expired sessions', () => {
    expect(() =>
      getRefreshCookiePolicy(new Date('2026-09-01T12:00:00.000Z')),
    ).toThrow('expired session');
  });

  it('uses the required host-only production cookie policy', () => {
    process.env.NODE_ENV = 'production';
    process.env.REFRESH_COOKIE_NAME = '__Host-sgi_refresh';

    expect(getRefreshCookiePolicy()).toEqual({
      name: '__Host-sgi_refresh',
      options: expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      }),
    });
    expect(getRefreshCookiePolicy().options.domain).toBeUndefined();
  });

  it('fails closed for a non-host production cookie name or cross-site policy', () => {
    process.env.NODE_ENV = 'production';
    process.env.REFRESH_COOKIE_NAME = 'sgi_refresh';
    expect(() => getRefreshCookiePolicy()).toThrow('must be named');

    process.env.REFRESH_COOKIE_NAME = '__Host-sgi_refresh';
    process.env.REFRESH_COOKIE_SAME_SITE = 'none';
    expect(() => getRefreshCookiePolicy()).toThrow('approved same-site policy');
  });
});
