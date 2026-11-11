import {
  getFrontendOrigin,
  getFrontendOrigins,
} from './frontend-origin.config';

describe('frontend origin config', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalFrontendUrl = process.env.FRONTEND_URL;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalFrontendUrl === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = originalFrontendUrl;
  });

  it('uses localhost only outside production when config is missing', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.FRONTEND_URL;

    expect(getFrontendOrigin()).toBe('http://localhost:5173');
  });

  it('requires explicit config in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.FRONTEND_URL;

    expect(() => getFrontendOrigin()).toThrow('must be configured');
  });

  it.each(['not-a-url', 'https://example.com/path', 'ftp://example.com'])(
    'rejects malformed or non-origin value %s',
    (value) => {
      process.env.FRONTEND_URL = value;
      expect(() => getFrontendOrigin()).toThrow('valid HTTP(S) origin');
    },
  );

  it('returns an explicit valid origin', () => {
    process.env.FRONTEND_URL = 'https://app.example.com:8443/';
    expect(getFrontendOrigin()).toBe('https://app.example.com:8443');
  });

  it('allows localhost and its loopback alias in development', () => {
    process.env.NODE_ENV = 'development';
    process.env.FRONTEND_URL = 'http://localhost:5174';

    expect(getFrontendOrigins()).toEqual([
      'http://localhost:5174',
      'http://127.0.0.1:5174',
    ]);
  });

  it('allows 127.0.0.1 and its loopback alias preserving protocol and port', () => {
    process.env.NODE_ENV = 'development';
    process.env.FRONTEND_URL = 'https://127.0.0.1:8443';

    expect(getFrontendOrigins()).toEqual([
      'https://127.0.0.1:8443',
      'https://localhost:8443',
    ]);
  });

  it('defaults to localhost and its loopback alias in development', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.FRONTEND_URL;

    expect(getFrontendOrigins()).toEqual([
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]);
  });

  it('adds no loopback alias for non-loopback hosts', () => {
    process.env.NODE_ENV = 'development';
    process.env.FRONTEND_URL = 'https://app.example.com';

    expect(getFrontendOrigins()).toEqual(['https://app.example.com']);
  });

  it('allows only the configured origin in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://app.example.com';

    expect(getFrontendOrigins()).toEqual(['https://app.example.com']);
  });

  it('does not expose loopback aliases in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'http://localhost:5174';

    expect(getFrontendOrigins()).toEqual(['http://localhost:5174']);
  });

  it('rejects malformed config when building the allowlist', () => {
    process.env.NODE_ENV = 'development';
    process.env.FRONTEND_URL = 'not-a-url';

    expect(() => getFrontendOrigins()).toThrow('valid HTTP(S) origin');
  });
});
