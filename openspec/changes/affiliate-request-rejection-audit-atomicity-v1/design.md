# Design

## Context

See `proposal.md` for motivation and `specs/affiliate-requests/spec.md` for the behavior delta. Approval already performs Affiliate creation, request resolution, and audit logging in one serializable Prisma transaction. Rejection currently performs `requirePending`, `updateMany`, `findOne`, and audit logging across independent operations.

## Goals / Non-Goals

**Goals:**

- Commit `REJECTED`, rejection reason, reviewer identity, timestamp, and `AFFILIATE_REQUEST_REJECTED` together.
- Preserve compare-and-set protection against stale or concurrent review actions.
- Keep the existing controller, DTO, response projection, frontend query invalidation, and audit event payload contract.

**Non-Goals:**

- No Prisma schema or migration change.
- No capability/RBAC migration; existing OpenSpec work identifies explicit review capability selection as unresolved.
- No applicant notification or public status lookup; their identity, privacy, and delivery contract is not documented.
- No Person, User, Affiliate, or submitted-snapshot ownership change.

## Decisions

### Use one serializable interactive transaction

Rejection will read the request, validate `PENDING`, conditionally update it, read the response projection, and write the audit event through the same transaction client. This matches approval's existing consistency boundary and allows audit persistence failure to roll back the state change.

Alternative: retain the current update followed by best-effort audit. Rejected because it permits terminal state without history.

### Retain conditional `updateMany` claim

The update remains guarded by `{ id, status: 'PENDING' }`. `requirePending` gives correct not-found versus resolved errors; the claim prevents two concurrent reviewers from both resolving a request. A zero update count remains a conflict.

Alternative: replace with unconditional `update`. Rejected because it weakens concurrency safety.

### Test transaction client use and rollback propagation

Focused unit tests will assert audit logging receives the transaction client and that an audit rejection bubbles through the transaction callback rather than returning a successful terminal response. Database-mutating rollback verification remains operator-owned and is not claimed by unit mocks.

## Risks / Trade-offs

- [Transaction mock drift] → adapt only the focused service test double to the existing interactive-transaction pattern.
- [Audit service unavailable] → preserve optional dependency behavior; when present and failing, failure rolls back rejection.
- [Real PostgreSQL rollback unverified] → report `NOT_VERIFIED` unless an authorized disposable database test is provided.

## Migration Plan

1. Deploy code and focused tests; no schema migration or data backfill.
2. Roll back application code if needed; no persisted shape changed.
3. Existing rejected requests remain unchanged; this only protects future rejection operations.
