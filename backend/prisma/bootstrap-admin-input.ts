import { readFile, stat } from 'node:fs/promises';
import type { MinimalBootstrapAdmin } from './minimal-bootstrap';

const MAX_INPUT_SIZE = 16 * 1024;
const EXPECTED_KEYS = new Set([
  'fullName',
  'identification',
  'email',
  'password',
]);

export async function readBootstrapAdminFile(
  filePath: string | undefined,
): Promise<MinimalBootstrapAdmin> {
  if (!filePath?.trim()) throw new Error('BOOTSTRAP_ADMIN_FILE_REQUIRED');
  let content: string;
  if (filePath === '-') {
    content = await readStandardInput();
  } else {
    const metadata = await stat(filePath);
    if (!metadata.isFile() || metadata.size > MAX_INPUT_SIZE)
      throw new Error('BOOTSTRAP_ADMIN_FILE_INVALID');
    if (process.platform !== 'win32' && (metadata.mode & 0o077) !== 0)
      throw new Error('BOOTSTRAP_ADMIN_FILE_PERMISSIONS');
    content = await readFile(filePath, 'utf8');
  }

  const parsed: unknown = JSON.parse(content);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('BOOTSTRAP_ADMIN_FILE_INVALID');
  const record = parsed as Record<string, unknown>;
  if (
    Object.keys(record).some((key) => !EXPECTED_KEYS.has(key)) ||
    [...EXPECTED_KEYS].some((key) => typeof record[key] !== 'string')
  ) {
    throw new Error('BOOTSTRAP_ADMIN_FILE_INVALID');
  }
  return {
    fullName: record.fullName as string,
    identification: record.identification as string,
    email: record.email as string,
    password: record.password as string,
  };
}

async function readStandardInput(): Promise<string> {
  process.stdin.setEncoding('utf8');
  let content = '';
  for await (const chunk of process.stdin) {
    content += String(chunk);
    if (Buffer.byteLength(content) > MAX_INPUT_SIZE)
      throw new Error('BOOTSTRAP_ADMIN_FILE_INVALID');
  }
  return content;
}
