const DEFAULT_TTL_SECONDS = 60;
const DEFAULT_MAX = 5;

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function publicRequestRateLimitConfig() {
  return {
    ttl: positiveInteger(process.env.PUBLIC_REQUEST_RATE_LIMIT_TTL_SECONDS, DEFAULT_TTL_SECONDS) * 1000,
    limit: positiveInteger(process.env.PUBLIC_REQUEST_RATE_LIMIT_MAX, DEFAULT_MAX),
  };
}
