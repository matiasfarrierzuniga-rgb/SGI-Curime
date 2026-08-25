# F0 Stabilization Report

## Historical baseline

- SHA: `12c290412baf722e34f8f9c901832b23fb86b856`
- Status: `REJECTED`
- ERP implementation gate: `BLOCKED`

The historical result and the Phase 1 worktree were preserved. This report belongs to the independent stabilization branch.

## BE-001

### Root cause

`backend/prisma/schema.prisma` writes the Prisma client to `../generated/prisma`, and `backend/.gitignore` excludes that directory. `backend/package.json` had no lifecycle script invoking Prisma generation. A clean `npm ci` therefore installed dependencies without creating the imports required by the backend. Classification: `D`, with the generated output intentionally unversioned.

### Fix

Added the canonical lifecycle command:

```text
postinstall: prisma generate --config prisma.config.ts
```

### Verification

- Install: `PASS`; generated `backend/generated/prisma` was created.
- Build: `PASS`.
- Unit: `PASS` (35 suites, 193 tests).
- E2E: `BLOCKED`; PostgreSQL was unavailable. Docker Compose could not connect to the Docker Desktop daemon and no local service was listening on port 5432.

## FE-001

### Root cause

Vitest's default fork pool and file parallelism caused worker startup failures even though the tests themselves passed. The discriminating serial run passed all 27 files and 107 tests. Classification: `A/F`.

### Fix

Configured Vitest to use the threads pool, one worker, and no file parallelism.

### Verification

- Install: `PASS`.
- Lint: `PASS` (existing Fast Refresh warnings only).
- Architecture: `PASS`.
- Tests: `PASS` (27 files, 107 tests).
- Build: `PASS`.

## BE-002

The backend install reported 4 npm audit vulnerabilities (1 low, 3 high) and pending install-script approval warnings. These did not cause BE-001 and were not changed. Frontend install reported no vulnerabilities.

## Final QA

- Frontend: `PASS`.
- Backend: `PASS` after PostgreSQL health validation and Prisma migration execution.

## New baseline

- Candidate SHA: `git rev-parse HEAD` after the stabilization commit.
- `BASELINE_STATUS=ACCEPTED`
- `ERP_IMPLEMENTATION_GATE=OPEN`

## Files changed

- `backend/package.json`
- `frontend/vite.config.ts`
- `docs/architecture/erp-f0-stabilization.md`

## Commits

The stabilization fix is now committed as a single atomic change on the F0 branch.

## Remaining deviations

None for the technical baseline stabilization scope. The historical baseline remains rejected and preserved for comparison; the new candidate baseline is accepted in this worktree.