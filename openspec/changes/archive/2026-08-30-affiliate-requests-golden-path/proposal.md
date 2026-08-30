## Why

SGI-Curime already accepts public affiliate requests and has a stable backend contract for administrators to list, review, approve, and reject them, but the ERP route for administrative review remains a placeholder. This change completes the smallest coherent frontend golden path so approved requests create active affiliates through the existing backend transaction and become manageable through the existing Affiliates feature.

## What Changes

- Add an Architecture v2 vertical slice at `frontend/src/features/affiliate-requests` for request models, API access, TanStack Query ownership, list/detail queries, approve/reject mutations, and cache invalidation.
- Replace the `/app/admin/requests` placeholder with an accessible, responsive "Solicitudes de afiliación" administrative screen.
- Support backend-defined list filters, request detail review, explicit approve/reject confirmation, busy feedback, retry, conflict handling, and refreshed request state.
- Keep routing and navigation gated by the existing `adm.requests.read` capability while preserving backend `Administrador` role enforcement.
- Keep Affiliate creation exclusively in `PATCH /affiliate-requests/:id/approve`; no direct frontend creation or `POST /affiliates` is introduced.
- Add network-isolated frontend coverage for the administrative workflow and directed backend test hardening for existing transactional behavior.
- Keep public `AffiliationPage`, User Requests, notifications, legacy cleanup, backend contracts, business rules, and unrelated test debt outside this change.

## Capabilities

### New Capabilities

- `affiliate-requests`: Defines the administrative Affiliate Requests golden path, including listing, filtering, detail review, approve/reject actions, authorization behavior, UI refresh, and integration with the existing Affiliates lifecycle.

### Modified Capabilities

None.

## Impact

- Affects the new `frontend/src/features/affiliate-requests` slice, application routing for `/app/admin/requests`, ERP navigation labeling/targeting, and associated frontend tests.
- Reuses existing Foundation UI, shared error handling, shared authorization policy, Axios HTTP client, and TanStack Query conventions.
- Adds tests to the existing backend Affiliate Requests service/e2e coverage without changing endpoints, DTOs, Prisma schema, migrations, states, authorization, or production behavior unless a separately approved defect is revealed.
- Introduces no dependencies, persisted-data changes, new capabilities, new endpoints, or direct Affiliate creation path.
