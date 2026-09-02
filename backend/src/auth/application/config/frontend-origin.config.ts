const DEVELOPMENT_FRONTEND_ORIGIN = 'http://localhost:5173';

export function getFrontendOrigin(): string {
  const configured = process.env.FRONTEND_URL?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FRONTEND_URL must be configured in production.');
    }
    return DEVELOPMENT_FRONTEND_ORIGIN;
  }

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error('FRONTEND_URL must be a valid HTTP(S) origin.');
  }
  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new Error('FRONTEND_URL must be a valid HTTP(S) origin.');
  }
  return url.origin;
}
