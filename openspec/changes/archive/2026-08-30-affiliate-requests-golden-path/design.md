## Context

See `proposal.md` for motivation. The backend already exposes a stable Affiliate Requests contract with `PENDING`, `APPROVED`, and `REJECTED` states and performs approval plus Affiliate creation atomically. The public `/afiliacion` flow already submits real requests through legacy frontend files, while `/app/admin/requests` is a protected placeholder. The current frontend architecture requires `app -> features -> shared`, TanStack Query ownership of server state, default-deny access behavior, network-isolated tests, and no new code in legacy areas.

## Goals / Non-Goals

**Goals:**

- Add the smallest Architecture v2 feature slice needed for administrative list, detail, approve, and reject behavior.
- Replace the existing placeholder without changing the backend contract or public request submission flow.
- Keep request data authoritative, mutation-safe, accessible, responsive, and covered by isolated tests.
- Preserve clear semantic separation between affiliate requests and user-account requests.

**Non-Goals:**

- Migrating `AffiliationPage` or deleting `src/services/affiliateRequestsService.ts` and its legacy types.
- Adding endpoints, capabilities, request states, notification delivery, reprocessing, editing, reopening, or direct Affiliate creation.
- Refactoring User Requests, Inventory Loans, the legacy Affiliates service, global architecture, or unrelated test TypeScript debt.
- Changing backend production code unless directed tests reveal a defect and a separate approval authorizes correction.

## Decisions

### 1. Use a self-contained Affiliate Requests feature slice

Create `frontend/src/features/affiliate-requests` with `api`, `model`, `hooks`, and `ui` ownership plus a narrow public `index.ts`. The model will represent the backend response, `PENDING | APPROVED | REJECTED`, list filters (`status`, `search`, `email`, `identification`, `page`, `limit`), create-independent admin types, and approve response shape.

This follows the established Affiliates slice and avoids adding administrative behavior to legacy `src/services` or `src/types`. Reusing the legacy service was rejected because it would extend a horizontal legacy boundary and leave server-state ownership outside the feature.

### 2. Mirror only the existing backend HTTP contract

The feature API will expose list, detail, approve, and reject methods backed by:

- `GET /affiliate-requests`
- `GET /affiliate-requests/:id`
- `PATCH /affiliate-requests/:id/approve`
- `PATCH /affiliate-requests/:id/reject`

It will not expose administrative update, cancel, delete, reopen, reprocess, or direct Affiliate creation methods. Public create remains in the current public flow for this change.

### 3. Let TanStack Query own administrative server state

Define stable keys rooted at `['affiliate-requests']`, with normalized filter-bearing list keys and ID-bearing detail keys. The list and detail components consume query results directly rather than copying request records into component state. Local state is limited to filters, pagination, selection, rejection input, and dialog/action state.

Approve and reject mutations invalidate the Affiliate Requests root and selected detail after success. Approval does not import Affiliates internals or duplicate its query keys; the existing Affiliates screen retrieves the backend-owned result through its normal authoritative query when opened. This avoids a feature-to-feature dependency while preserving `app -> features -> shared`.

### 4. Compose the page from focused feature UI

The feature will own an `AffiliateRequestsPage` and focused components for filters, list/table presentation, detail review, and action flow. It will reuse `PageHeader`, `StatusBadge`, `EmptyState`, `LoadingState`, `ErrorState`, `Modal`, `ConfirmDialog`, pagination, shared error extraction, and existing form-validation primitives when applicable.

Approve uses a direct explicit confirmation. Reject collects a required reason before final confirmation. A synchronous in-flight guard complements mutation pending state to prevent duplicate submissions before React rerenders. Terminal requests expose no review actions.

Generic DataTable, FilterBar, form-framework, or cross-domain abstractions are rejected because this is a single concrete use case.

### 5. Replace the existing route placeholder and clarify navigation

`AppRoutes` will render the feature page at `/app/admin/requests` under the existing `RoleRoute capability="adm.requests.read"`. ERP navigation will expose this destination as "Solicitudes de afiliación". The existing `/admin/user-requests` route remains functionally unchanged and is labeled distinctly where navigation exposes it, without moving or refactoring its implementation.

No new capability is introduced. Backend authorization remains `@Roles('Administrador')` with JWT and roles guards; frontend gating remains UX-level policy only.

### 6. Harden backend behavior through tests first

Extend current Affiliate Requests unit/e2e coverage for reject success, terminal-state conflicts, transactional claim failure, Affiliate-create rollback, duplicate Affiliate handling, `ACTIVE` Affiliate creation, request terminal state, and duplicate-processing protection. Production service changes are not part of this plan. If a test demonstrates a real defect, implementation stops for explicit scope approval rather than silently changing the backend contract.

### 7. Keep frontend tests network-isolated

Feature component and routing tests mock the feature API/service boundary and use a fresh QueryClient with query and mutation retries disabled. API tests mock the shared HTTP client. Routing tests retain the explicit no-network guard. Mutation tests assert both calls and cache invalidation.

## Risks / Trade-offs

- [The existing `adm.requests.read` capability is broader than approve/reject semantics] -> Keep it as the frozen compatibility decision and document finer permissions as deferred debt.
- [Affiliate Requests and User Requests can remain visually confusing] -> Use explicit labels and distinct routes while leaving User Requests behavior untouched.
- [Public create and admin review temporarily use different frontend layers] -> Accept deliberate duplication during this stage; do not expand legacy or migrate `AffiliationPage` without a separate change.
- [Approval may expose a backend conflict after another administrator resolves a request] -> Display backend-derived errors, invalidate/refetch authoritative data, and keep the UI recoverable.
- [Directed backend tests may reveal a production defect] -> Stop and request explicit approval before changing backend source.

## Migration Plan

1. Add the feature data foundation and isolated tests without connecting routes.
2. Add list and detail UI with query-driven states.
3. Add approve/reject workflows and mutation invalidation.
4. Replace the `/app/admin/requests` placeholder and clarify navigation labels.
5. Add directed backend test hardening and complete accessibility/responsive checks.
6. Run focused tests and full frontend verification; run applicable backend tests/build because backend tests are affected.

Rollback consists of restoring the placeholder route/navigation entry and removing the new feature slice and tests. No database, API, dependency, or persisted-data migration is involved.
