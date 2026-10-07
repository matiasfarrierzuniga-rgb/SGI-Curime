import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { processEnvironmentForTest, redactTarget, validateDisposableEnvironment } from './disposable-postgres-guard.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, '../..');
const workspaceRoot = path.resolve(backendRoot, '..');
const composeFile = path.join(workspaceRoot, 'compose.integration-test.yaml');
const prismaCli = path.join(backendRoot, 'node_modules', 'prisma', 'build', 'index.js');
const tsxCli = path.join(backendRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const command = process.argv[2];
const target = validateDisposableEnvironment(process.env);
const stateDirectory = path.join(os.tmpdir(), 'sgi-curime-disposable-postgres');
const stateFile = path.join(stateDirectory, `state-${target.port}.json`);
const lockDirectory = path.join(stateDirectory, `lock-${target.port}`);

function fail(code) { throw new Error(`disposable-postgres lifecycle failed: ${code}`); }
function safeDiagnostic(value) {
  return String(value ?? '').replace(/postgres(?:ql)?:\/\/\S+/gi, '[REDACTED_DATABASE_URL]').replace(/[\r\n]+/g, ' ').slice(0, 500);
}
function run(executable, args, options = {}) {
  const result = spawnSync(executable, args, { cwd: backendRoot, encoding: 'utf8', ...options });
  if (result.error || result.status !== 0) fail(`command=${executable} status=${result.status ?? 'none'} detail=${safeDiagnostic(result.stderr || result.error?.message)}`);
  return result.stdout;
}
async function acquireLock() {
  await mkdir(stateDirectory, { recursive: true });
  try { await mkdir(lockDirectory); } catch { fail('lifecycle-lock-held'); }
}
async function releaseLock() { await rm(lockDirectory, { recursive: true, force: true }); }
async function loadState() {
  if (!existsSync(stateFile)) fail('missing-lifecycle-state');
  return JSON.parse(await readFile(stateFile, 'utf8'));
}
function testEnvironment(state) {
  return processEnvironmentForTest({
    ...process.env,
    TEST_DATABASE_URL: state.testDatabaseUrl,
    TEST_POSTGRES_PORT: target.port,
    TEST_RUN_TOKEN: state.token,
  });
}
function dockerCompose(state, args) {
  return run('docker', ['compose', '-f', composeFile, '-p', state.project, ...args], { env: testEnvironment(state) });
}
function inspectContainer(containerId) {
  const raw = run('docker', ['inspect', containerId]);
  return JSON.parse(raw)[0];
}
function verifyOwnership(state) {
  const containerId = dockerCompose(state, ['ps', '-q', 'postgres']).trim();
  if (!containerId) fail('owned-container-missing');
  const inspected = inspectContainer(containerId);
  const labels = inspected.Config?.Labels ?? {};
  if (labels['com.docker.compose.project'] !== state.project || labels['com.sgi-curime.disposable'] !== 'true' || labels['com.sgi-curime.run-token'] !== state.token) fail('docker-ownership-mismatch');
  if ((inspected.Mounts ?? []).length !== 0) fail('persistent-mount-rejected');
  const dataTmpfs = inspected.HostConfig?.Tmpfs?.['/var/lib/postgresql/data'];
  if (typeof dataTmpfs !== 'string' || dataTmpfs.length === 0) fail('postgres-data-tmpfs-missing-or-empty');
  return containerId;
}
async function ensurePortAvailable() {
  await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', () => reject(new Error('host-port-unavailable')));
    server.listen(Number(target.port), target.host, () => server.close(resolve));
  }).catch((error) => fail(error.message));
}
async function start() {
  if (existsSync(stateFile)) fail('existing-lifecycle-state-run-down-first');
  await ensurePortAvailable();
  const state = { testDatabaseUrl: target.value, token: randomBytes(18).toString('hex'), project: `sgi_curime_pg_${randomBytes(8).toString('hex')}` };
  await writeFile(stateFile, JSON.stringify(state), { mode: 0o600 });
  try {
    dockerCompose(state, ['up', '--detach', '--wait', '--wait-timeout', '75', 'postgres']);
    verifyOwnership(state);
    console.log(`disposable-postgres start: ${redactTarget(target)} project=${state.project}`);
  } catch (error) {
    try {
      verifyOwnership(state);
      dockerCompose(state, ['down', '--volumes', '--remove-orphans']);
    } catch {}
    await rm(stateFile, { force: true });
    throw error;
  }
}
async function health() {
  const state = await loadState();
  const containerId = verifyOwnership(state);
  const inspected = inspectContainer(containerId);
  if (inspected.State?.Health?.Status !== 'healthy') fail('container-not-healthy');
  console.log(`disposable-postgres health: ${redactTarget(target)} healthy`);
}
async function migrate() {
  const state = await loadState();
  verifyOwnership(state);
  run(process.execPath, [prismaCli, 'migrate', 'deploy', '--config', 'prisma.config.ts'], { env: testEnvironment(state) });
  console.log(`disposable-postgres migrate: ${redactTarget(target)} applied`);
}
async function smoke() {
  const state = await loadState();
  verifyOwnership(state);
  run(process.execPath, [tsxCli, path.join('test', 'helpers', 'disposable-postgres-smoke.ts')], { env: testEnvironment(state) });
  console.log(`disposable-postgres smoke: ${redactTarget(target)} passed`);
}
async function cleanup() {
  const state = await loadState();
  verifyOwnership(state);
  run(process.execPath, [tsxCli, path.join('test', 'helpers', 'disposable-postgres-cleanup.mjs')], { env: testEnvironment(state) });
  console.log(`disposable-postgres cleanup: ${redactTarget(target)} complete`);
}
async function down() {
  const state = await loadState();
  verifyOwnership(state);
  dockerCompose(state, ['down', '--volumes', '--remove-orphans']);
  const remaining = dockerCompose(state, ['ps', '-q', 'postgres']).trim();
  if (remaining) fail('container-remains-after-down');
  await rm(stateFile, { force: true });
  console.log(`disposable-postgres destroy: ${redactTarget(target)} removed`);
}
async function certify() {
  await start();
  try { await health(); await migrate(); await smoke(); await cleanup(); } finally { await down(); }
}

if (!['start', 'health', 'migrate', 'smoke', 'cleanup', 'down', 'certify'].includes(command)) fail('unknown-command');
await acquireLock();
try { await ({ start, health, migrate, smoke, cleanup, down, certify })[command](); } finally { await releaseLock(); }
