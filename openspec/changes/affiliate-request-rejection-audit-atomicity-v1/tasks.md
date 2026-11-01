# Tasks

## 1. Atomic rejection persistence

- [x] 1.1 Refactor AffiliateRequest rejection to execute pending-state validation, conditional resolution update, response read, and audit write in one serializable Prisma transaction; verify the audit write receives the transaction client and API response remains unchanged.
- [x] 1.2 Preserve `PENDING` compare-and-set concurrency behavior, `NotFoundException` for missing requests, and `ConflictException` for resolved requests; verify through focused service tests.

## 2. Focused verification

- [x] 2.1 Extend `affiliate-requests.service.spec.ts` for successful rejection audit-in-transaction and simulated audit failure propagation; verify `npm test -- affiliate-requests.service.spec.ts --runInBand` passes from `backend/`.
- [x] 2.2 Validate OpenSpec with `openspec.cmd validate affiliate-request-rejection-audit-atomicity-v1 --strict`, run `git diff --check`, and inspect scope excludes schema, migrations, frontend, capabilities, notifications, and unrelated modules.

## Workflow follow-up

- Do not archive this change. Apply only after planning review and explicit apply authorization.
