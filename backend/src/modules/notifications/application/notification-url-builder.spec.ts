import { NotificationUrlBuilder } from './notification-url-builder';

describe('NotificationUrlBuilder', () => {
  const builder = new NotificationUrlBuilder({
    baseUrl: 'https://sgi.example.org/app',
  });

  it('builds the activation URL from the configured base URL', () => {
    expect(builder.activation('abc')).toBe(
      'https://sgi.example.org/activate-account?token=abc',
    );
  });

  it('builds the password reset URL', () => {
    expect(builder.passwordReset('abc')).toBe(
      'https://sgi.example.org/reset-password?token=abc',
    );
  });

  it('encodes tokens safely', () => {
    const url = new URL(builder.activation('a+b&c=d /?'));

    expect(url.searchParams.get('token')).toBe('a+b&c=d /?');
    expect(url.toString()).toContain('token=a%2Bb%26c%3Dd+%2F%3F');
  });
});
