import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readBootstrapAdminFile } from './bootstrap-admin-input';

describe('bootstrap administrator input', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'sgi-bootstrap-input-'));
  });
  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('reads an exact private JSON contract without changing it', async () => {
    const path = join(directory, 'admin.json');
    const content = JSON.stringify({
      fullName: 'Administración Inicial',
      identification: '123456789',
      email: 'admin@adicurime.com',
      password: 'StrongPassword1',
    });
    await writeFile(path, content, { mode: 0o600 });

    await expect(readBootstrapAdminFile(path)).resolves.toMatchObject({
      email: 'admin@adicurime.com',
    });
    await expect(readFile(path, 'utf8')).resolves.toBe(content);
  });

  it('rejects missing, malformed and extended input', async () => {
    await expect(readBootstrapAdminFile(undefined)).rejects.toThrow(
      'BOOTSTRAP_ADMIN_FILE_REQUIRED',
    );
    const path = join(directory, 'admin.json');
    await writeFile(path, '{bad', { mode: 0o600 });
    await expect(readBootstrapAdminFile(path)).rejects.toBeInstanceOf(
      SyntaxError,
    );
    await writeFile(
      path,
      JSON.stringify({
        fullName: 'A',
        identification: '1',
        email: 'a@example.test',
        password: 'StrongPassword1',
        unexpected: 'rejected',
      }),
      { mode: 0o600 },
    );
    await expect(readBootstrapAdminFile(path)).rejects.toThrow(
      'BOOTSTRAP_ADMIN_FILE_INVALID',
    );
  });
});
