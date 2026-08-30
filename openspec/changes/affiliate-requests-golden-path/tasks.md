## 1. Data Foundation

- [x] 1.1 Create Affiliate Requests admin models for backend response fields, `PENDING | APPROVED | REJECTED`, supported list filters, pagination, rejection payload, and approval response.
- [x] 1.2 Implement the feature API client for list, detail, approve, and reject using only the existing Affiliate Requests endpoints.
- [x] 1.3 Add API client tests that mock `httpClient` and verify method, path, query parameters, and rejection payload without real network requests.
- [x] 1.4 Define normalized Affiliate Request query keys and list/detail query hooks with TanStack Query ownership of server state.
- [x] 1.5 Implement approve/reject mutation hooks with Affiliate Request list/detail invalidation and tests for service calls and invalidation.
- [x] 1.6 Export only the feature page and required public types through `features/affiliate-requests/index.ts`, preserving architecture boundaries.

## 2. Requests List

- [x] 2.1 Build request filters for backend-supported status, search, email, and identification fields, resetting pagination when filter input changes.
- [x] 2.2 Build the responsive request list/table with visible status text, accessible row actions, server totals, and pagination.
- [x] 2.3 Compose `AffiliateRequestsPage` with `PageHeader`, loading, empty, error, retry, filtered-empty, and successful list states.
- [x] 2.4 Add network-isolated page tests for list rendering, supported filters, pagination reset, loading, empty, error, and meaningful retry behavior.

## 3. Detail / Review

- [x] 3.1 Build the request detail modal around the authoritative detail query and display identity, contact, affiliation reason, status, review metadata, and rejection reason when present.
- [x] 3.2 Hide approve/reject controls for `APPROVED` and `REJECTED` requests while keeping terminal state and review information visible.
- [x] 3.3 Add network-isolated detail tests for loading, success, terminal states, error, retry, and close behavior.

## 4. Approve / Reject

- [ ] 4.1 Add explicit approval confirmation for `PENDING` requests, with busy feedback and a synchronous in-flight guard against duplicate submission.
- [ ] 4.2 Add rejection-reason capture and validation followed by explicit destructive confirmation, without sending a mutation for blank input.
- [ ] 4.3 Handle approve/reject success by refreshing authoritative request data and reporting success without directly creating an Affiliate.
- [ ] 4.4 Handle backend conflict and generic mutation errors with backend-derived messages, released busy state, refresh/retry paths, and no accidental dialog close.
- [ ] 4.5 Add network-isolated workflow tests for approve, reject, blank rejection reason, 409 conflict, generic recovery, successful retry, duplicate prevention, and terminal-state refresh.

## 5. Routing / Navigation

- [ ] 5.1 Replace the `/app/admin/requests` placeholder with the Affiliate Requests feature page under the existing `adm.requests.read` gate.
- [ ] 5.2 Expose `/app/admin/requests` as "Solicitudes de afiliación" in ERP navigation and keep `/admin/user-requests` semantically distinct without refactoring its workflow.
- [ ] 5.3 Extend routing and navigation tests for administrator access, anonymous redirect to `/login`, missing/unknown capability redirect to `/403`, default deny, correct labels, and zero real HTTP requests.

## 6. Backend Test Hardening

- [ ] 6.1 Extend Affiliate Requests service tests for successful reject, `REJECTED` persistence data, and approve/reject attempts against already processed requests.
- [ ] 6.2 Test transactional claim failure and duplicate-processing protection when the conditional `PENDING` update affects no row.
- [ ] 6.3 Test approval transaction behavior: request becomes `APPROVED`, created Affiliate data is `ACTIVE`, duplicate Affiliate is rejected, Affiliate creation failure rejects the transaction, and post-success audit is not emitted on failure.
- [ ] 6.4 Extend applicable e2e coverage for existing approve/reject HTTP behavior without changing controllers, DTOs, Prisma schema, migrations, states, or authorization.
- [ ] 6.5 Stop implementation and request explicit approval if hardening tests reveal a production defect that requires backend source changes.

## 7. UX / Accessibility Hardening

- [ ] 7.1 Reuse existing Foundation UI for status, loading, empty, error, modal, confirmation, page header, and pagination behavior; add no duplicate generic abstractions.
- [ ] 7.2 Verify keyboard operation, initial/restored focus, accessible names and labels, dialog semantics, live busy/error feedback, and non-color-only status communication.
- [ ] 7.3 Verify filters, list/table, detail, and action dialogs remain readable and operable at mobile, tablet, and desktop widths.
- [ ] 7.4 Add focused accessibility assertions for action names, status text, validation feedback, busy states, and modal/confirmation behavior.

## 8. Final Validation

- [ ] 8.1 Run focused frontend Affiliate Requests API, hooks, page, workflow, routing, and navigation tests.
- [ ] 8.2 Run focused backend Affiliate Requests unit/e2e tests and backend build when backend tests are changed.
- [ ] 8.3 Run `npm run verify` from `frontend` and record architecture, lint, full test, and build results without treating known unchanged warnings as regressions.
- [ ] 8.4 Inspect final Git diff for network isolation, no secrets, no new dependencies, no new endpoint/capability/business rule, no `POST /affiliates`, and no out-of-scope legacy or User Requests changes.
