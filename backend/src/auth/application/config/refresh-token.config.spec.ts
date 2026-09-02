import { getRefreshCookiePolicy } from './refresh-token.config';

describe('refresh cookie policy', () => {
  beforeEach(() => {
    process.env.REFRESH_TOKEN_TTL = '3600';
    process.env.REFRESH_COOKIE_SAME_SITE = 'lax';
    delete process.env.REFRESH_COOKIE_NAME;
    jest.useFakeTimers().setSystemTime(new Date('2026-09-01T12:00:00.000Z'));
  });

  afterEach(() => jest.useRealTimers());

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
});
