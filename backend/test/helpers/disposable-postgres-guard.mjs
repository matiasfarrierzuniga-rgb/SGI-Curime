const EXPECTED_DATABASE = 'sgi_curime_integration_test';
const EXPECTED_USER = 'sgi_curime_test';
const EXPECTED_PASSWORD = 'sgi_curime_test_password';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

function fail(code) {
  throw new Error(`disposable-postgres guard rejected: ${code}`);
}

function parseTestUrl(value, name = 'TEST_DATABASE_URL') {
  if (typeof value !== 'string' || value.length === 0) fail(`missing-${name}`);
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(`malformed-${name}`);
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) fail(`protocol-${name}`);
  if (!LOCAL_HOSTS.has(url.hostname)) fail(`host-${name}`);
  if (!url.port || url.port === '5432') fail(`port-${name}`);
  const port = Number(url.port);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) fail(`port-${name}`);
  const database = decodeURIComponent(url.pathname).replace(/^\//, '');
  if (database !== EXPECTED_DATABASE || !database.endsWith('_test')) fail(`database-${name}`);
  if (decodeURIComponent(url.username) !== EXPECTED_USER) fail(`username-${name}`);
  if (decodeURIComponent(url.password) !== EXPECTED_PASSWORD) fail(`credentials-${name}`);
  if (url.searchParams.has('schema') && url.searchParams.get('schema') !== 'public') fail(`schema-${name}`);
  return { value, host: url.hostname, port: url.port, database, username: decodeURIComponent(url.username) };
}

function sameTarget(left, right) {
  return left.host === right.host && left.port === right.port && left.database === right.database && left.username === right.username;
}

function redactTarget(parsed) {
  return `${parsed.host}:${parsed.port}/${parsed.database} user=${parsed.username}`;
}

function validateDisposableEnvironment(environment = process.env) {
  if (environment.NODE_ENV !== 'test') fail('node-env');
  if (environment.ALLOW_TEST_DATABASE_RESET !== 'true') fail('reset-opt-in');
  const test = parseTestUrl(environment.TEST_DATABASE_URL);
  for (const name of ['DATABASE_URL', 'DIRECT_URL']) {
    if (environment[name]) {
      const candidate = parseTestUrl(environment[name], name);
      if (!sameTarget(test, candidate) || candidate.value !== test.value) fail(`mismatch-${name}`);
    }
  }
  return test;
}

function processEnvironmentForTest(environment = process.env) {
  const test = validateDisposableEnvironment(environment);
  return {
    ...environment,
    DATABASE_URL: test.value,
    DIRECT_URL: test.value,
  };
}

export {
  EXPECTED_DATABASE,
  EXPECTED_PASSWORD,
  EXPECTED_USER,
  parseTestUrl,
  processEnvironmentForTest,
  redactTarget,
  validateDisposableEnvironment,
};
