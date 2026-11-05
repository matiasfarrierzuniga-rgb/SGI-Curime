# Proposal

## Why

Affiliate-request rejection currently changes request state before writing its audit event. If auditing fails, a request can be terminally rejected without durable review history. This breaks the review trail required for an administrative affiliation decision.

## What Changes

- Make `PATCH /affiliate-requests/:id/reject` persist the `REJECTED` state, review metadata, and `AFFILIATE_REQUEST_REJECTED` audit event in one serializable transaction.
- Preserve existing public submission, administrator authorization, rejection DTO, response shape, states, and frontend review flow.
- Add focused service coverage for successful atomic rejection, terminal-state conflict, and rollback when audit persistence fails.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `affiliate-requests`: rejection must commit review state and audit history atomically.

## Impact

- Affected backend: `backend/src/affiliate-requests/affiliate-requests.service.ts` and focused service tests.
- No Prisma schema, migration, API route, payload, frontend contract, role/capability, notification, User, Person, or Affiliate change.
- CU V2 references: CU-04 and CU-05 are related per `docs/decisions/community-account-registration.md`; immutable catalog source is absent, so V2 traceability remains `NOT_VERIFIED`.
