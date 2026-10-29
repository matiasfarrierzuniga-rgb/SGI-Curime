# Contributing to SGI-Curime

## Canonical integration policy

`development` is the shared integration branch. `main` is the stable promotion branch. Direct feature, fix, refactor, documentation, test, or configuration work must not be developed directly on either branch.

This is repository policy. It does not assert that GitHub branch protections or Rulesets are active; verify remote configuration separately before reporting it as enabled.

All new work follows this lifecycle:

```text
development
  │
  └── topic branch
       │
       ├── work
       ├── tests / verification
       ├── commit
       ├── push
       └── Pull Request → development
              │
              ├── review
              ├── QA / required checks
              └── merge → development

development ── reviewed promotion Pull Request ──▶ main
```

## 1. Start from shared integration baseline

Before creating a branch, use the approved shared baseline:

```bash
git switch development
git pull --ff-only origin development
git status
git rev-parse HEAD
```

The working tree must be clean before branching. Do not create a worktree or change branches to bypass existing work without explicit authorization and a preservation plan.

## 2. Create a dedicated branch

Use one branch per coherent change. Recommended prefixes:

- `feat/` — new functionality
- `fix/` — defect correction
- `refactor/` — internal restructuring without intended functional change
- `docs/` — documentation or governance artifacts
- `test/` — test-only work
- `chore/` — tooling, repository or maintenance work

Example:

```bash
git switch -c docs/erp-f0-03-role-capability-matrix
```

Do not reuse historical stabilization branches for new work.

## 3. Work and verify locally

Verification must match the scope of the change. At minimum, run the checks affected by the work and record the results in the Pull Request.

### Backend

From `backend/`:

```bash
npm ci
npm run build
npm test
npm run test:e2e
```

Run additional checks required by the changed area.

### Frontend

From `frontend/`:

```bash
npm ci
npm run verify
```

`npm run verify` currently runs lint, architecture validation, tests and build.

### Repository-level hygiene

Before committing or opening the PR:

```bash
git diff --check
git status
```

## 4. Commit discipline

Commits should be scoped, reviewable and describe intent. Prefer Conventional Commit-style messages, for example:

```text
docs(erp): define role capability matrix
fix(auth): reject inactive users during login
refactor(users): isolate repository adapter
```

Do not mix unrelated cleanup with the intended change.

## 5. Push the branch

```bash
git push -u origin <branch-name>
```

Direct pushes to `development` and `main` are prohibited by project policy.

## 6. Open an integration Pull Request into development

Every shared integration into `development` must use a Pull Request. The PR must include:

- purpose and scope;
- explicit out-of-scope items;
- changed areas/files at a useful level;
- verification commands and results;
- risks or compatibility notes;
- documentation/migration impact when applicable.

Draft PRs are encouraged while work is incomplete. A PR should be marked ready only when its intended verification has passed.

## 7. Review and QA gate

A PR is mergeable only when:

1. the branch is up to date enough to evaluate safely against `development`;
2. required automated status checks pass;
3. at least one approving review is present when branch protection requires it;
4. requested changes and unresolved review conversations are addressed;
5. QA evidence is recorded in the PR;
6. the diff contains no unrelated scope creep.

A green deployment status alone does not replace application tests, architecture checks, or backend E2E verification when those areas are affected.

## 8. Merge and promote

Merge an integration PR only through GitHub after the review/QA gate passes. Do not bypass configured protections for normal development.

Use the repository's approved merge strategy consistently. After merge:

```bash
git switch development
git pull --ff-only origin development
git branch -d <branch-name>
```

Delete the remote branch when it is no longer needed.

Promote `development` to stable `main` through a separate reviewed Pull Request. Record verification evidence appropriate to the promotion and do not claim a Ruleset, approval requirement, or protection is active without current remote evidence.

## 9. Emergency exception

A direct change to `development` or `main` is reserved for exceptional repository recovery only. Any exception must be documented with reason, scope and verification evidence. Normal feature delivery, fixes, refactors and documentation changes do not qualify.

## Protection target

GitHub protections or Rulesets for `development` and `main` should enforce the following project policy when configured:

- require a Pull Request before merging;
- require at least 1 approval;
- dismiss stale approvals when new commits materially change the PR;
- require conversation resolution before merge;
- require relevant status checks once GitHub Actions CI is defined;
- require branches to be up to date before merge when using required checks;
- block force pushes;
- block branch deletion;
- apply protections to administrators/maintainers where the repository plan and permissions allow it.

Until CI workflows exist, local QA evidence remains mandatory and must be recorded in each PR. This target is not evidence that remote enforcement currently exists.
