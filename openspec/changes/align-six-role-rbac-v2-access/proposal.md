# Proposal

> **SUPERSEDED FOR CURRENT RBAC V2.3 DECISIONS.** This change preserves prior implementation and certification evidence. Its 24-grant Secretariat and 105-assignment references are historical planning observations; current functional responsibilities and `canonical-role-grants.ts` govern new work.

## Why

The six canonical RBAC V2 roles and their 105 current `RolePermission` assignments require end-to-end verification against implemented NestJS operations, effective guards, React routes, navigation, dashboards, and action-level controls. C3-AUTH-01 removes two obsolete UserRequest review grants from the System Administrator without expanding privileges.

## What Changes

- Build an evidence-backed traceability matrix for all six canonical roles: role → persisted capability → business operation/CRUD → endpoint → effective guard → frontend route → screen/action.
- Reconcile backend capability enforcement with operations that already exist, preserving domain-scope rules and default-deny behavior; do not create endpoints merely to match catalog names.
- Reconcile React route guards, Sidebar visibility, dashboards, and action controls with server-delivered capabilities and real API support.
- Validate the profiles in fixed order: Presidency (16 assignments), Secretariat (24), Treasury (26), Institutional Operator (12), System Administrator (27), and Community User (0 institutional assignments).
- Reuse the approved administrative dashboard, financial and inventory experiences, shared layouts, and existing screens rather than creating one dashboard per role.
- Keep community accounts outside the ERP while preserving implemented community functionality and public volunteering access.
- Classify every catalog capability without an equivalent implementation as unsupported rather than exposing placeholder UI or broadening another operation.
- Add positive and negative authorization coverage for endpoints, direct routes, navigation, dashboards, and actions; prepare integration evidence and a GO/NO-GO assessment.
- Preserve PostgreSQL historical data and Prisma schema. Canonical grants reconcile additively and revoke only unexpected grants from canonical roles through an explicit, opt-in synchronization command; no migration or real-database execution is part of this change.

## Capabilities

### New Capabilities

- `security/canonical-role-access-alignment`: Defines end-to-end, least-privilege alignment of persisted canonical role assignments with implemented backend operations and frontend access surfaces for all six roles.

### Modified Capabilities

- `erp-shell-presentation`: Makes Sidebar destinations and shared dashboard composition follow the verified canonical capability-to-feature contract while retaining responsive, accessible shell behavior.

## Impact

- Backend NestJS controllers, capability metadata/guards, business-scope authorization, and focused authorization tests where current contracts are misaligned.
- Frontend route policy, capability constants, navigation configuration, dashboard composition, action visibility, and focused route/UI tests.
- Canonical RBAC synchronization script and current 105-assignment matrix; no database writes, Prisma schema edit, or migration was executed.
- Existing OpenSpec RBAC V2 authorization contract remains the baseline for catalog recognition, ERP admission, persisted capability evaluation, and community exclusion.
- Related CU V2 identifiers must be recorded per operation when immutable evidence exists; otherwise they remain explicitly `NOT_VERIFIED` and do not authorize implementation.
