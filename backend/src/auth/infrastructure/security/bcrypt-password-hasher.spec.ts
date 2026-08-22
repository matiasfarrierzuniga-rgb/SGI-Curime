import { BcryptPasswordHasher } from './bcrypt-password-hasher';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher();

  it('hashes a password that matches on compare', async () => {
    const hash = await hasher.hash('Secret1!');

    expect(hash).not.toBe('Secret1!');
    await expect(hasher.compare('Secret1!', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hasher.hash('Secret1!');

    await expect(hasher.compare('Wrong1!', hash)).resolves.toBe(false);
  });
});
