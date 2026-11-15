import { validateMinimalBootstrapTarget } from './bootstrap-target';

const connectionString = 'postgresql://user:password@postgres:5432/sgi_curime';
const environment = {
  BOOTSTRAP_EXECUTION_CONTEXT: 'SGI_CURIME_COMPOSE_PRODUCTION',
  BOOTSTRAP_TARGET_DATABASE: 'sgi_curime',
};

describe('minimal bootstrap target guard', () => {
  it('accepts only explicitly confirmed internal Compose PostgreSQL target', () => {
    expect(() =>
      validateMinimalBootstrapTarget(connectionString, environment),
    ).not.toThrow();
  });

  it.each([
    ['missing execution confirmation', connectionString, {}],
    [
      'external PostgreSQL host',
      'postgresql://user:password@db.example.test:5432/sgi_curime',
      environment,
    ],
    [
      'Supabase host',
      'postgresql://user:password@db.example.supabase.co:5432/sgi_curime',
      environment,
    ],
    [
      'different database',
      'postgresql://user:password@postgres:5432/other_database',
      environment,
    ],
    [
      'missing database declaration',
      connectionString,
      { BOOTSTRAP_EXECUTION_CONTEXT: 'SGI_CURIME_COMPOSE_PRODUCTION' },
    ],
  ])('rejects %s', (_reason, target, targetEnvironment) => {
    expect(() =>
      validateMinimalBootstrapTarget(target, targetEnvironment),
    ).toThrow(
      /BOOTSTRAP_(EXECUTION_CONTEXT_REQUIRED|TARGET_DATABASE_REQUIRED|TARGET_REJECTED)/,
    );
  });
});
