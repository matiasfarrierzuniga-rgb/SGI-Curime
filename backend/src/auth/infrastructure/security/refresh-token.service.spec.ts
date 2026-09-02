import { RefreshTokenService } from './refresh-token.service';

describe('RefreshTokenService', () => {
  const service = new RefreshTokenService();

  it('generates a base64url credential with 256 bits of entropy', () => {
    const token = service.generate();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('hashes credentials as lowercase SHA-256 hexadecimal', () => {
    expect(service.hash('credential')).toBe(
      'e265b6f564601a1fe8dc42785cd18a868bd8013eb5899560e79248767a683e6b',
    );
  });

  it('produces distinct hashes for distinct credentials', () => {
    expect(service.hash('credential-one')).not.toBe(
      service.hash('credential-two'),
    );
  });
});
