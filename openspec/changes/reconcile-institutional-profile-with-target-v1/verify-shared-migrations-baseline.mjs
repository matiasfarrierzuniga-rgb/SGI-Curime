#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const FROZEN_COMMITS = [
  ['freeze canónico Target v1', 'dc86d810549216eec90fc561705d6b0063179f70'],
  ['estado documental', '642dbe164265de93c3c44f43f2911522b5faee6f'],
  ['DB-1 histórica', '9173bee4e54192f78cf1210fbf8c770c4519007d'],
  ['DB-1 archivada', '23fd62bf5b3146de7cd7e759d78dffc6e36c5b77'],
  ['baseline origin/main', 'dc2a2d84a91e2484b9959812ba80cd7f8db151ac'],
];

const BASELINE_ORIGIN_MAIN = 'dc2a2d84a91e2484b9959812ba80cd7f8db151ac';
const PROTECTED_MIGRATIONS = [
  {
    path: 'backend/prisma/migrations/20260920120000_add_institutional_profile/migration.sql',
    blob: '23e6410d2073209a71bca470e8d15e4d2f3aa72c',
  },
  {
    path: 'backend/prisma/migrations/20260922120000_add_institutional_board/migration.sql',
    blob: 'b7c78f1cf9d9f5117081b566ede3c0449acda499',
  },
];

function fail(message) {
  console.error(`shared-migrations-baseline guard failed: ${message}`);
  process.exit(1);
}

function runGit(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });

  if (result.error) {
    fail(`could not execute git: ${result.error.message}`);
  }

  return result;
}

const rootResult = runGit(['rev-parse', '--show-toplevel'], process.cwd());
if (rootResult.status !== 0) {
  fail(`repository root unavailable: ${rootResult.stderr.trim()}`);
}

const repositoryRoot = rootResult.stdout.trim();

for (const [label, commit] of FROZEN_COMMITS) {
  const result = runGit(['cat-file', '-e', `${commit}^{commit}`], repositoryRoot);
  if (result.status !== 0) {
    fail(`missing frozen commit for ${label}: ${commit}`);
  }
}

const treeResult = runGit(
  ['ls-tree', BASELINE_ORIGIN_MAIN, '--', ...PROTECTED_MIGRATIONS.map(({ path }) => path)],
  repositoryRoot,
);
if (treeResult.status !== 0) {
  fail(`cannot inspect baseline tree ${BASELINE_ORIGIN_MAIN}: ${treeResult.stderr.trim()}`);
}

const baselineBlobs = new Map();
for (const line of treeResult.stdout.trim().split('\n').filter(Boolean)) {
  const [metadata, path] = line.split('\t');
  const [, type, blob] = metadata.split(' ');
  baselineBlobs.set(path, { type, blob });
}

for (const migration of PROTECTED_MIGRATIONS) {
  const baselineEntry = baselineBlobs.get(migration.path);
  if (!baselineEntry) {
    fail(`missing protected route in baseline tree: ${migration.path}`);
  }
  if (baselineEntry.type !== 'blob') {
    fail(`baseline route is not a blob: ${migration.path}`);
  }
  if (baselineEntry.blob !== migration.blob) {
    fail(`baseline blob mismatch for ${migration.path}: expected ${migration.blob}, got ${baselineEntry.blob}`);
  }

  const workingBlobResult = runGit(['hash-object', '--', migration.path], repositoryRoot);
  if (workingBlobResult.status !== 0) {
    fail(`missing protected route in working tree: ${migration.path}`);
  }

  const workingBlob = workingBlobResult.stdout.trim();
  if (!workingBlob) {
    fail(`missing working-tree blob for ${migration.path}`);
  }
  if (workingBlob !== migration.blob) {
    fail(`working-tree blob mismatch for ${migration.path}: expected ${migration.blob}, got ${workingBlob}`);
  }
}

const diffResult = runGit(
  ['diff', '--quiet', BASELINE_ORIGIN_MAIN, '--', ...PROTECTED_MIGRATIONS.map(({ path }) => path)],
  repositoryRoot,
);
if (diffResult.status === 1) {
  fail(`final diff changes protected migrations from ${BASELINE_ORIGIN_MAIN}`);
}
if (diffResult.status !== 0) {
  fail(`cannot compare final diff: ${diffResult.stderr.trim()}`);
}

console.log('shared-migrations-baseline guard passed');
