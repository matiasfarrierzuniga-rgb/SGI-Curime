import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  processEnvironmentForTest,
  validateDisposableEnvironment,
} from './disposable-postgres-guard.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, '../..');
const lifecycle = path.join(here, 'disposable-postgres-lifecycle.mjs');
const jestCli = path.join(
  backendRoot,
  'node_modules',
  'jest',
  'bin',
  'jest.js',
);
const environment = processEnvironmentForTest(process.env);

validateDisposableEnvironment(environment);

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: backendRoot,
    encoding: 'utf8',
    env: environment,
    stdio: 'inherit',
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      `user-request PostgreSQL certification command failed: status=${result.status ?? 'none'}`,
    );
  }
}

let started = false;
let primaryError;
try {
  run([lifecycle, 'start']);
  started = true;
  run([lifecycle, 'health']);
  run([lifecycle, 'migrate']);
  run([
    '--experimental-vm-modules',
    jestCli,
    '--config',
    './test/jest-postgres-integration.json',
    '--runInBand',
  ]);
} catch (error) {
  primaryError = error;
} finally {
  if (started) {
    try {
      run([lifecycle, 'down']);
    } catch (downError) {
      if (primaryError) {
        throw new AggregateError(
          [primaryError, downError],
          'UserRequest certification failed and disposable PostgreSQL cleanup also failed',
          { cause: primaryError },
        );
      }
      throw downError;
    }
  }
}

if (primaryError) throw primaryError;
