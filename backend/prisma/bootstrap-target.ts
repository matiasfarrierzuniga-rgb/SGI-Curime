const REQUIRED_CONTEXT = 'SGI_CURIME_COMPOSE_PRODUCTION';
const COMPOSE_POSTGRES_HOST = 'postgres';
const COMPOSE_POSTGRES_PORT = '5432';

export function validateMinimalBootstrapTarget(
  connectionString: string,
  environment: NodeJS.ProcessEnv = process.env,
): void {
  if (environment.BOOTSTRAP_EXECUTION_CONTEXT !== REQUIRED_CONTEXT) {
    throw new Error('BOOTSTRAP_EXECUTION_CONTEXT_REQUIRED');
  }

  const expectedDatabase = environment.BOOTSTRAP_TARGET_DATABASE?.trim();
  if (!expectedDatabase) throw new Error('BOOTSTRAP_TARGET_DATABASE_REQUIRED');

  let target: URL;
  try {
    target = new URL(connectionString);
  } catch {
    throw new Error('BOOTSTRAP_DATABASE_URL_INVALID');
  }

  if (!['postgres:', 'postgresql:'].includes(target.protocol)) {
    throw new Error('BOOTSTRAP_DATABASE_URL_INVALID');
  }
  if (
    target.hostname.toLowerCase() !== COMPOSE_POSTGRES_HOST ||
    target.port !== COMPOSE_POSTGRES_PORT
  ) {
    throw new Error('BOOTSTRAP_TARGET_REJECTED');
  }

  const database = decodeURIComponent(target.pathname).replace(/^\//, '');
  if (!database || database !== expectedDatabase) {
    throw new Error('BOOTSTRAP_TARGET_REJECTED');
  }
}
