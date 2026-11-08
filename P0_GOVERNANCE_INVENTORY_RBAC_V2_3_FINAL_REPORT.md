# P0 Governance + Inventory + RBAC V2.3 — Final Report

## Decision

`NO-GO — PARTIALLY_CERTIFIED`

Implementation changes are limited to the P0 authorization boundary. Focused
automated verification passed; broader six-role matrix certification remains open.

## Implemented

### RBAC dashboard boundary

- Administrative dashboard data now requires both `erp.dashboard.read` and
  `adm.affiliates.read`.
- A dashboard-entry capability alone renders the shared institutional welcome
  shell and authorized destinations without requesting `/admin-reports/dashboard`.
- Operator retains the inventory summary through `inv.inventory.read` without
  administrative metric access.
- Treasury retains the financial entry path from `getErpEntryPath`; direct
  dashboard access remains a capability-composed shell.
- `AdminDashboard` does not mount data queries for sessions lacking the
  administrative-metrics boundary.

### Backend authorization evidence

- Added HTTP certification for `/admin-reports/dashboard`:
  unauthenticated `401`, persisted-capability absence `403`, and persisted
  `erp.dashboard.read` allow.
- Added controller regression proving dashboard permission codes, not role
  labels, are forwarded to the service.
- Dashboard service continues to scope every returned domain metric from
  server-resolved persisted capabilities.

### Governance and inventory

- No source change required after focused inspection.
- Governance appointment replacement remains capability-protected by
  `adm.institutional-board.manage`, transactional, person-first, and audited.
- Inventory reads/reports remain protected by `inv.inventory.read`.
- Inventory writes and loan lifecycle operations remain default-deny through
  `UnsupportedOperationGuard`; no V2 name-based capability mapping was added.

## Files changed

- `backend/src/admin-reports/admin-reports.controller.spec.ts`
- `backend/src/auth/presentation/guards/rbac-http-certification.spec.ts`
- `frontend/src/features/admin-dashboard/hooks/useAdminDashboard.ts`
- `frontend/src/features/admin-dashboard/index.ts`
- `frontend/src/features/admin-dashboard/model/canUseAdministrativeDashboard.ts`
- `frontend/src/features/admin-dashboard/ui/AdminDashboard.tsx`
- `frontend/src/features/admin-dashboard/ui/AdminDashboard.test.tsx`
- `frontend/src/pages/erp/AppHomePage.tsx`
- `frontend/src/pages/erp/AppHomePage.test.tsx`

## Validation

| Check | Status | Evidence |
| --- | --- | --- |
| Backend focused Jest | `PASSED` | 8 suites, 99 tests: dashboard 401/403, controller contracts, governance board, inventory items/reports |
| Frontend focused tests | `PASSED` | 7 files, 115 tests: dashboard, AppHome, routes, navigation, ERP guards, inventory access |
| Frontend lint | `PASSED` | `npm.cmd run lint`; existing Fast Refresh warnings only |
| Frontend architecture | `PASSED` | `npm.cmd run check:architecture` |
| Frontend production build / TypeScript | `PASSED` | `npm.cmd run build`; existing >500 kB bundle warning only |
| Backend focused lint | `PASSED` | `npx.cmd eslint` over changed backend specs, no `--fix` |
| Backend build | `PASSED` | `npm.cmd run build` |
| PostgreSQL-mutating certification C3-SEC-01 | `NOT_EXECUTED` | Explicitly requires approved disposable environment |
| `git diff --check` | `PASSED` | No whitespace errors |

## Remaining required certification

```powershell
Run the remaining OpenSpec role gates, full frontend `npm.cmd run verify`, and
approved disposable-PostgreSQL C3-SEC-01 certification before a release GO.
```

## OpenSpec state

- `align-six-role-rbac-v2-access`: tasks 2.2, 3.3 and 3.4 are complete and
  evidenced. Matrix recheck and role-gate tasks remain open.
- C3-SEC-01 human PostgreSQL integration certification remains pending.
- No Prisma schema, migration, role grant, seed, or persistence-data change.

## Residual risk

- Six-role end-to-end certification remains incomplete until the 107-row matrix,
  remaining role gates, full frontend verify, manual responsive/accessibility
  review, and C3-SEC-01 pass.
- Rollback: discard the implementation diff or revert its future verified commit;
  no database rollback is required.
