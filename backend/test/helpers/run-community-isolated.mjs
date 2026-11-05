import { spawnSync } from 'node:child_process';
import {
  EXPECTED_DATABASE,
  EXPECTED_PASSWORD,
  EXPECTED_USER,
} from './disposable-postgres-guard.mjs';

const command = process.argv[2];
if (
  ![
    'start',
    'health',
    'migrate',
    'migrations',
    'community',
    'community-http',
    'down',
  ].includes(command)
)
  throw new Error('unsupported test phase');
const port = '55432';
const url = `postgresql://${EXPECTED_USER}:${EXPECTED_PASSWORD}@127.0.0.1:${port}/${EXPECTED_DATABASE}`;
const env = {
  ...process.env,
  NODE_ENV: 'test',
  ALLOW_TEST_DATABASE_RESET: 'true',
  TEST_DATABASE_URL: url,
  DATABASE_URL: url,
  DIRECT_URL: url,
  TEST_POSTGRES_PORT: port,
  JWT_SECRET: 'synthetic-isolated-test-secret',
  JWT_EXPIRES_IN: '1h',
  EMAIL_PROVIDER: 'fake',
  EMAIL_SEND_ENABLED: 'false',
  APP_PUBLIC_URL: 'https://sgi.example.test',
  MAX_LOGIN_ATTEMPTS: '3',
  ACCOUNT_LOCKOUT_MINUTES: '15',
};
const result = spawnSync(
  process.execPath,
  ['test/helpers/disposable-postgres-lifecycle.mjs', command],
  { cwd: process.cwd(), env, stdio: 'inherit' },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
