import { getFrontendOrigin } from './frontend-origin.config';

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
});
