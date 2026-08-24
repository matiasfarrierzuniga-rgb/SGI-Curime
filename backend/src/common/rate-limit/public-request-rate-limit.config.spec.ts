import { publicRequestRateLimitConfig } from './public-request-rate-limit.config';

describe('public request rate-limit configuration', () => {
  afterEach(() => {
    delete process.env.PUBLIC_REQUEST_RATE_LIMIT_TTL_SECONDS;
    delete process.env.PUBLIC_REQUEST_RATE_LIMIT_MAX;
  });
  it('uses safe defaults', () =>
    expect(publicRequestRateLimitConfig()).toEqual({ ttl: 60_000, limit: 5 }));
  it('uses configured values', () => {
    process.env.PUBLIC_REQUEST_RATE_LIMIT_TTL_SECONDS = '120';
    process.env.PUBLIC_REQUEST_RATE_LIMIT_MAX = '8';
    expect(publicRequestRateLimitConfig()).toEqual({ ttl: 120_000, limit: 8 });
  });
});
