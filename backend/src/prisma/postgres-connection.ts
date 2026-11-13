import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_SUPABASE_CA_PATH = resolve(
  process.cwd(),
  'certs',
  'supabase-prod-ca-2021.crt',
);

function isSupabaseHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host.endsWith('.pooler.supabase.com') || host.endsWith('.supabase.co');
}

export function getSupabaseCaPath(): string {
  return process.env.SUPABASE_CA_CERT_PATH?.trim() || DEFAULT_SUPABASE_CA_PATH;
}

/**
 * Return a pg config with certificate and hostname verification enabled for
 * Supabase. Local and Docker URLs are returned unchanged.
 *
 * pg-connection-string lets sslmode in a URL replace an explicit `ssl` object.
 * Removing SSL query options before passing the URL keeps the verified CA
 * configuration authoritative while Node's default hostname check remains on.
 */
export function getPostgresConnectionConfig(
  connectionString: string,
): string | { connectionString: string; ssl: { ca: string; rejectUnauthorized: true } } {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    return connectionString;
  }

  if (!isSupabaseHost(parsed.hostname)) return connectionString;

  const caPath = getSupabaseCaPath();
  if (!existsSync(caPath)) {
    throw new Error(
      `Supabase CA certificate not found at ${caPath}. Set SUPABASE_CA_CERT_PATH to a trusted CA file.`,
    );
  }

  parsed.searchParams.delete('ssl');
  parsed.searchParams.delete('sslmode');
  parsed.searchParams.delete('sslrootcert');
  parsed.searchParams.delete('sslcert');
  parsed.searchParams.delete('sslkey');

  return {
    connectionString: parsed.toString(),
    ssl: {
      ca: readFileSync(caPath, 'utf8'),
      rejectUnauthorized: true,
    },
  };
}

/**
 * Prisma CLI uses a URL and cannot receive pg's SSL object. Add the official
 * CA path and verify-full mode for Supabase migration/status commands.
 */
export function getPrismaDatasourceUrl(
  connectionString: string | undefined,
): string | undefined {
  if (!connectionString) return connectionString;

  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    return connectionString;
  }

  if (!isSupabaseHost(parsed.hostname)) return connectionString;

  parsed.searchParams.set('sslmode', 'verify-full');
  parsed.searchParams.set('sslrootcert', getSupabaseCaPath());
  return parsed.toString();
}
