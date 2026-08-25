## Purpose

Describe the problem/change and why it is needed.

## Scope

### In scope
-

### Out of scope
-

## Changes

-

## Verification / QA

Record the exact commands executed and their results.

### Backend
- [ ] `npm ci` (when backend dependencies/install path is affected)
- [ ] `npm run build` (when backend is affected)
- [ ] `npm test` (when backend is affected)
- [ ] `npm run test:e2e` (when backend behavior/integration is affected)

### Frontend
- [ ] `npm ci` (when frontend dependencies/install path is affected)
- [ ] `npm run verify` (when frontend is affected)

### Repository
- [ ] `git diff --check`
- [ ] Working tree reviewed for unrelated changes

### Results

```text
Paste concise PASS/FAIL evidence here.
```

## Risk and compatibility

- Breaking changes: none / describe
- Database/schema impact: none / describe
- API contract impact: none / describe
- Auth/authorization impact: none / describe
- Routing/navigation impact: none / describe
- Migration/deployment considerations: none / describe

## Review gate

- [ ] Scope is coherent and contains no unrelated cleanup
- [ ] Documentation updated when required
- [ ] Requested changes addressed
- [ ] Review conversations resolved
- [ ] Required checks/statuses are green
- [ ] QA evidence is sufficient for the changed scope

## Merge decision

Do not merge until the review and QA gate is satisfied.