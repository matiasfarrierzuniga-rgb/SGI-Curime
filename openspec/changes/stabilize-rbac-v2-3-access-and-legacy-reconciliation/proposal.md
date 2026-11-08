# Proposal

## Why

RBAC V2.3 has a recovered implementation baseline, six persisted canonical roles, and approved institutional workflows, but its OpenSpec state, navigation coverage, legacy role coupling, and appointment-end authorization procedure remain inconsistent. This successor change stabilizes those boundaries without redesigning roles, removing working functions, rewriting history, or performing unauthorized database operations.

## What Changes

- Consolidate the six canonical roles from their approved functional responsibilities and the executable canonical catalog; reconcile obsolete numeric references without removing current working access solely to satisfy historical matrices.
- Preserve Secretariat's implemented appointment and affiliation-request workflows, including create, edit, replace and revoke appointments plus approve/reject affiliation requests, and certify positive and negative guards.
- Align persisted `RolePermission`, backend API guards, frontend routes, Sidebar, dashboard, buttons and direct deep links for Events and Volunteering without adding grants to satisfy tests.
- Decouple effective authorization progressively from `ChangeUserRoleUseCase`, `updateActiveAffiliateRoleForUser`, `Affiliate.legacyRoleId`, `ROLE_CAPABILITIES` fixtures and assembly projections while retaining required compatibility readers and historical snapshots.
- Define an auditable privilege-review procedure for appointment end, replacement, office change and term conclusion. Preserve `Person`, `User`, `Affiliate`, `User.personId` and all `GovernanceMembership` history; governance offices never grant or revoke software roles automatically.
- Reconcile current identity, governance and RBAC documentation with implemented contracts, marking superseded material as historical without deleting evidence or duplicating full matrices.
- Establish reversible checkpoints and GO/NO-GO gates for a reviewed PR toward `main`, with truthful `PASSED`, `FAILED`, `NOT_EXECUTED` and `NOT_APPLICABLE` evidence.
- Exclude physical legacy-column removal, role redesign, destructive migration, reset, truncate, drop, seed reinitialization, unapproved RBAC synchronization, disposable PostgreSQL, merge, rebase, squash, push and automatic integration.

## Capabilities

### New Capabilities

- `security/rbac-v2-access-certification`: Defines the canonical functional role contract, exact operation-level authorization alignment, cross-layer certification and default-deny integration gates.
- `security/legacy-role-compatibility`: Defines staged retirement of legacy role-derived authorization while preserving historical metadata, snapshots and compatibility until certified replacement.
- `governance/institutional-privilege-review`: Defines privilege review after appointment lifecycle changes without equating governance office with software authorization.

### Modified Capabilities

- `erp-shell-presentation`: Strengthens Sidebar, dashboard, route, direct-link and action coherence with effective persisted capabilities, including Events and Volunteering.
- `affiliate-requests`: Replaces administrator-label assumptions with effective capability enforcement while preserving Secretariat's approved review, approval and rejection workflow.

## Impact

- Backend: canonical role/grant policy, capability guards and fixtures, Users role-change use case/repository, authentication projections, Affiliates, Affiliate Requests, institutional board, assemblies and audit coverage.
- Frontend: ERP navigation, routes, Sidebar/dashboard composition, Events, Volunteering, affiliation-request actions and authorization tests.
- Documentation/OpenSpec: root/module READMEs, relevant AGENTS guidance, canonical identity/RBAC contracts, institutional-board documentation, related use-case traceability and current/historical change status.
- Persistence: no destructive operation in this change. Any future physical removal or data reconciliation requires separate approval, backup/rollback procedure and identified safe execution plan.
- Git: work remains on `feat/p0-governance-inventory-rbac-v2-3`; checkpoints `19988e4`, `de83b65`, `f55f3fc`, `ebfdaaa` and `62dc194`, plus `.archify/`, remain protected.
