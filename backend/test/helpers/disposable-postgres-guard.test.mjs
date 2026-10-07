import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDisposableEnvironment } from './disposable-postgres-guard.mjs';

const safe = {
  NODE_ENV: 'test',
  ALLOW_TEST_DATABASE_RESET: 'true',
  TEST_DATABASE_URL: 'postgresql://sgi_curime_test:sgi_curime_test_password@127.0.0.1:55432/sgi_curime_integration_test',
};

test('rejects unsafe and ambiguous disposable PostgreSQL configuration', () => {
  for (const environment of [
    { ...safe, NODE_ENV: 'development' },
    { ...safe, ALLOW_TEST_DATABASE_RESET: 'false' },
    { ...safe, TEST_DATABASE_URL: undefined },
    { ...safe, TEST_DATABASE_URL: undefined, DATABASE_URL: safe.TEST_DATABASE_URL },
    { ...safe, TEST_DATABASE_URL: safe.TEST_DATABASE_URL.replace(':55432', ':5432') },
    { ...safe, TEST_DATABASE_URL: safe.TEST_DATABASE_URL.replace('127.0.0.1', 'db.example.com') },
    { ...safe, TEST_DATABASE_URL: safe.TEST_DATABASE_URL.replace('integration_test', 'development') },
    { ...safe, DATABASE_URL: 'postgresql://sgi_curime_test:sgi_curime_test_password@127.0.0.1:55433/sgi_curime_integration_test' },
    { ...safe, DIRECT_URL: 'postgresql://sgi_curime_test:sgi_curime_test_password@127.0.0.1:55433/sgi_curime_integration_test' },
  ]) {
    assert.throws(() => validateDisposableEnvironment(environment), /guard rejected/);
  }
});

test('accepts exact runtime and CLI target alignment', () => {
  const parsed = validateDisposableEnvironment({
    ...safe,
    DATABASE_URL: safe.TEST_DATABASE_URL,
    DIRECT_URL: safe.TEST_DATABASE_URL,
  });
  assert.equal(parsed.database, 'sgi_curime_integration_test');
  assert.equal(parsed.port, '55432');
});
