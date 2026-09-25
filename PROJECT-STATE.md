# SGI-Curime Project State

## Current Phase

Repository Reconciliation / OpenSpec preconditions. BUILD is not authorized.

## Current Branch

`feat/reconcile-institutional-profile-with-target-v1`, tracking `origin/main`; inspect Git for the current checkpoint commit.

## Current OpenSpec Change

`openspec/changes/reconcile-institutional-profile-with-target-v1/`

## Last Completed Checkpoint

Target Model v1 frozen at `dc86d810549216eec90fc561705d6b0063179f70`; documentation status reconciled at `642dbe164265de93c3c44f43f2911522b5faee6f` on local branch `docs/engineering-documentation-foundation`.

## Current Task

Owner review of the completed baseline. Next: OpenSpec task 1.4, a read-only preflight that classifies reconciliation state without logging institutional values.

## Completed

- Reconciliation OpenSpec committed in `78d6dab`.
- Task 1.1 marked complete: branch starts from current `origin/main`; DB-1 implementation was not merged unchanged.
- Task 1.2 marked complete: immutable shared-migration hashes and a read-only final-diff guard recorded.
- Task 1.3 marked complete: InstitutionalProfile consumers, DINADECO contracts, Board FK, routes, capabilities, audit, frontend and test boundaries inventoried.
- Existing multi-agent system recovered and reused.

## Next Tasks

1. Complete task 1.4 read-only reconciliation preflight.
2. Complete task 1.5 abort behavior definition and evidence.
3. Complete task 1.6 checkpoint/restore procedure before any mutative work.

## Blocked / Decisions Required

- Owner approval required before BUILD or any Prisma, migration, database, backend, or frontend change.
- Authoritative institutional configuration and restorable database checkpoint are required before data mutation.

## Do Not Start Yet

DB-2 identity reconciliation, DB-4 governance redesign, destructive legacy retirement, schema changes, migrations, or application adaptation.

## Authoritative Artifacts

- Active change: `openspec/changes/reconcile-institutional-profile-with-target-v1/`
- Frozen Target v1: `docs/data/` at commit `dc86d81` (not present on current branch)
- Reconciled freeze status: local branch `docs/engineering-documentation-foundation`
- Archived DB-1 evidence: local branch `feat/db-1-organization-profile-foundation`

## Relevant Commit

`78d6dab spec(data): reconcile institutional profile with target v1`

## Agent System

Terra orchestrates; Pulse tracks status; Atlas owns data; Forge backend; Pixel frontend; Sentinel QA without test execution. Documentation is handled separately/manual when needed.

## Next Session Start Here

Read this file, inspect `git status`, then continue OpenSpec task 1.4 without changing frozen Target v1 or shared migrations. No mutative reconciliation work has started.
