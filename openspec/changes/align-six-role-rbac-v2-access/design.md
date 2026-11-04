# Design

## Context

See `proposal.md` and both spec deltas. Current branch `fix/consolidate-canonical-role-catalog` is at checkpoint `871f834`; `development` is the integration base, but this change must not merge either direction automatically. Existing RBAC consolidation recognizes 93 capability codes, resolves effective grants from persistence, admits five canonical ERP roles, and excludes the community role. It intentionally mapped only verified endpoint equivalents, leaving broader V2 capabilities non-routable.

The current frontend already has capability-filtered ERP navigation plus shared administrative, financial, and inventory dashboards, but legacy role helpers and routes coexist. Canonical matrix export tooling exists at `backend/scripts/export-canonical-rbac-matrix.sql`. The expected matrix has 107 assignments across six roles; PostgreSQL, Prisma, migrations, and grant data are frozen for this increment.

## Root Cause

1. Persistence combines two authorization dialects: legacy capabilities already attached to controllers/routes and 47 reviewed V2 identifiers recognized by policy but intentionally left non-routable by the preceding RBAC change.
2. Current canonical assignments mostly use V2 identifiers for Presidency, Secretariat, and Operator, while implemented modules still enforce legacy identifiers or legacy role names. Catalog recognition therefore does not imply a functional operation.
3. Frontend declares all 93 recognized codes, but route/navigation mappings cover mainly legacy capabilities. This correctly avoids accidental grants but leaves sparse institutional experiences.
4. Remaining role-name guards and presentation role checks create exceptions to capability-first traceability. Most important: `/admin-reports/dashboard` is role-guarded while `/app/dashboard` is capability-routed, and inventory mutations remain limited to legacy role names.
5. Some routes overstate implementation: `/app/roles` renders a placeholder despite a real read endpoint, while personal/profile routes intentionally follow self-service rules distinct from institutional capabilities.

## Current Traceability Matrix

Evidence: read-only export from the branch-provided script on 2026-11-04. It returned 107 non-null assignments with expected counts `16/24/26/12/29/0`; all six roles were active. `L` means implemented legacy capability; `V2` means V2 catalog capability. States: `A` aligned, `P` partial/misaligned, `U` no approved equivalent implementation. A V2 description is evidence of intended verb, not proof that a similarly named legacy endpoint is equivalent.

Compact contract notation: `BE` gives endpoint and effective guard; `FE` gives route/screen/action. `—` means no approved equivalent. Corrections never change grants.

### 01 — Presidency institutional (16)

| Capability | Origin / operation | Current BE → FE | State | Minimal proposal |
|---|---|---|---|---|
| `document.restricted.read` | V2 / read restricted document | — → — | U | Record gap; no document route. |
| `donations.approval` | V2 / approve donation | — → — | U | Do not equate with donation CRUD. |
| `erp.dashboard.read` | L / enter dashboard | role-guarded admin report not called → `/app/dashboard` generic | P | Keep capability route; reuse approved visual shell only, without admin metrics not authorized. |
| `events.proposal.approve` | V2 / approve proposal | — → — | U | Do not map to publish/manage. |
| `events.proposal.create` | V2 / create proposal | — → — | U | Record missing proposal workflow. |
| `finance.expense.request` | V2 / request expense | — → — | U | No expense-request endpoint/screen. |
| `finance.report.dinadeco` | V2 / generate report | — → — | U | Do not equate with legacy report read. |
| `governance.agreement.manage` | V2 / manage agreements | — → — | U | Record missing agreement operation. |
| `governance.assembly.create` | V2 / create notice | legacy assembly create uses another capability → no authorized action | U | Do not map without approved equivalence. |
| `governance.assembly.session` | V2 / execute session | legacy start/complete uses another capability → no authorized action | U | Record gap; preserve `Mis asambleas`. |
| `governance.minute.sign` | V2 / sign minute | — → — | U | Record missing signature contract. |
| `inventory.decommission` | V2 / decommission | legacy role-guarded item deactivation is not proven equivalent → — | U | No cross-map from name alone. |
| `padron.affiliate.read` | V2 / read affiliate file | legacy `/affiliates` uses `adm.affiliates.read` → — | U | Keep distinct until operation equivalence is approved. |
| `padron.application.review` | V2 / review application | legacy affiliate requests use other capabilities → — | U | Keep review distinct from read/approve. |
| `padron.sanction.apply` | V2 / apply sanction | role-guarded sanctions module → — | U | No route or guard conversion without approved contract. |
| `usr.profile.read` | L / own profile | authenticated `GET /users/me` → `/app/profile` unguarded inside ERP | P | Preserve self-service API; capability-guard ERP route only, keeping community `/profile`. |

### 02 — Secretariat institutional (24)

| Capability | Origin / operation | Current BE → FE | State | Minimal proposal |
|---|---|---|---|---|
| `directory.enterprise.review` | V2 / review enterprise | legacy ventures use `ent.*` → — | U | Do not infer venture-review equivalence. |
| `document.official.manage` | V2 / manage official registry | — → — | U | Record missing document module. |
| `document.restricted.read` | V2 / read restricted document | — → — | U | Record gap. |
| `erp.dashboard.read` | L / enter dashboard | role-guarded admin report not called → `/app/dashboard` generic | P | Use shared shell/authorized destinations, not unrestricted admin metrics. |
| `events.proposal.create` | V2 / create proposal | — → — | U | Record missing proposal workflow. |
| `events.proposal.review` | V2 / review proposal | — → — | U | Do not map to event manage. |
| `events.publish` | V2 / publish event | legacy `pub.events.publish` endpoints exist under another code → — | U | Require explicit equivalence decision before conversion. |
| `finance.expense.request` | V2 / request expense | — → — | U | Record gap. |
| `finance.report.dinadeco` | V2 / generate report | legacy `GET /financial/reports/dinadeco/annual` uses `fin.dinadeco.read` → — | U | Do not broaden from V2 name. |
| `governance.agreement.manage` | V2 / manage agreements | — → — | U | Record gap. |
| `governance.assembly.create` | V2 / create notice | legacy assembly manage capability → — | U | No automatic cross-map. |
| `governance.assembly.session` | V2 / execute session | legacy assembly manage capability → — | U | No automatic cross-map. |
| `governance.attendance.scan` | V2 / scan attendance | legacy attendance update uses assembly manage → — | U | Scanner workflow absent. |
| `governance.minute.sign` | V2 / sign minute | — → — | U | Record gap. |
| `governance.minute.write` | V2 / write minute | — → — | U | Record gap. |
| `padron.affiliate.read` | V2 / read affiliate file | legacy affiliates read uses another code → — | U | Keep distinct. |
| `padron.affiliate.status` | V2 / change status | legacy activate/deactivate role-guarded → — | U | Do not convert without approved status semantics. |
| `padron.affiliate.update` | V2 / update data | legacy update role-guarded → — | U | Do not convert without approved field/scope equivalence. |
| `padron.application.approve` | V2 / approve application | legacy approval role-guarded → — | U | Keep review and approval separate. |
| `padron.application.review` | V2 / review application | legacy requests read uses another code → — | U | Keep distinct. |
| `padron.sanction.apply` | V2 / apply sanction | legacy role-guarded sanctions → — | U | Record gap. |
| `usr.profile.read` | L / own profile | authenticated `GET /users/me` → `/app/profile` | P | Guard ERP route only; preserve self-service contract. |
| `volunteer.campaign.manage` | V2 / manage campaign | legacy opportunities use `vol.*` → — | U | Do not infer campaign/opportunity equivalence. |
| `volunteer.hours.certify` | V2 / certify hours | — → — | U | Record missing certification operation. |

### 03 — Treasury institutional (26)

| Capability | Origin / operation | Current BE → FE | State | Minimal proposal |
|---|---|---|---|---|
| `donations.inkind.register` | V2 / register in-kind | legacy `POST /donations` uses `don.donations.create` → — | U | Do not infer subtype equivalence. |
| `donations.monetary.register` | V2 / register monetary | legacy `POST /donations` uses `don.donations.create` → — | U | Do not infer subtype equivalence. |
| `donations.receipt.emit` | V2 / emit receipt | — → — | U | Record missing receipt operation. |
| `don.donations.cancel` | L / cancel | `PATCH /donations/:id/cancel`, `CapabilityGuard` → `/app/donations` action | A | Preserve. |
| `don.donations.create` | L / create | `POST /donations`, `CapabilityGuard` → `/app/donations` action | A | Preserve. |
| `don.donations.read` | L / read | `GET /donations[/:id]`, `CapabilityGuard` → `/app/donations` | A | Preserve. |
| `don.donations.update` | L / update | `PATCH /donations/:id`, `CapabilityGuard` → detail action | A | Preserve. |
| `erp.dashboard.read` | L / enter dashboard | generic entry → `/app/dashboard`; treasury redirect uses role plus finance reads | P | Keep financial dashboard as primary entry; test capability fallback. |
| `finance.cxc.generate` | V2 / create charge | — → — | U | No charge-generation endpoint approved. |
| `finance.expense.approve` | V2 / approve disbursement | — → — | U | Record gap. |
| `finance.expense.request` | V2 / request expense | — → — | U | Record gap. |
| `finance.ledger.reverse` | V2 / reverse ledger entry | — → — | U | Do not equate with donation cancellation. |
| `finance.ledger.write` | V2 / append ledger entry | legacy movement create uses another code → — | U | Keep separate until accounting semantics approved. |
| `finance.payment.verify` | V2 / verify payment | legacy payment recording is a different operation → — | U | Do not map. |
| `finance.period.lock` | V2 / lock period | — → — | U | Record gap. |
| `finance.receipt.emit` | V2 / emit receipt | — → — | U | Record gap. |
| `finance.reconcile` | V2 / reconcile | — → — | U | Record gap. |
| `finance.report.dinadeco` | V2 / generate report | legacy report read uses another code → — | U | Keep distinct. |
| `fin.charges.read` | L / read charges | `GET /financial/charges[/:id]`, `CapabilityGuard` → charges/dashboard | A | Preserve. |
| `fin.dinadeco.read` | L / read DINADECO report | `GET /financial/reports/dinadeco/annual`, `CapabilityGuard` → DINADECO | A | Preserve; no calculation change. |
| `fin.movements.create` | L / create movement | `POST /financial/movements`, `CapabilityGuard` → movement action | A | Preserve. |
| `fin.movements.read` | L / read movements | `GET /financial/movements*`, `CapabilityGuard` → movements/dashboard | A | Preserve. |
| `fin.payments.record` | L / record payment | `POST /financial/charges/:id/payments`, `CapabilityGuard` → charge detail action | A | Preserve. |
| `inventory.decommission` | V2 / decommission | no approved equivalent → — | U | Record gap. |
| `maintenance.funds.approve` | V2 / approve funds | — → — | U | Record gap. |
| `usr.profile.read` | L / own profile | authenticated `GET /users/me` → `/app/profile` | P | Guard ERP route only. |

### 04 — Institutional Operator (12)

| Capability | Origin / operation | Current BE → FE | State | Minimal proposal |
|---|---|---|---|---|
| `bookings.handover` | V2 / execute handover | — → — | U | Record missing handover workflow. |
| `bookings.manage` | V2 / manage review | legacy reservation lifecycle uses `res.*` → — | U | Do not expose approval/rejection from broad name. |
| `directory.stall.assign` | V2 / assign stall | — → — | U | Record gap. |
| `erp.dashboard.read` | L / enter dashboard | generic entry → `/app/dashboard` | P | Reuse inventory summary and authorized links; no new dashboard. |
| `events.proposal.create` | V2 / create proposal | — → — | U | Record gap. |
| `finance.expense.request` | V2 / request expense | — → — | U | Record gap. |
| `inventory.decommission` | V2 / decommission | legacy item deactivation role-guarded → — | U | No mapping without decommission semantics. |
| `inventory.item.manage` | V2 / manage item | legacy item writes role-guarded → hidden/denied | U | Candidate requires explicit endpoint-by-endpoint equivalence; not approved by names. |
| `inventory.loan.manage` | V2 / manage loan dispatch | legacy loan writes role-guarded → hidden/denied | U | Candidate requires lifecycle equivalence decision. |
| `inv.inventory.read` | L / inventory read | inventory GET/report endpoints, `CapabilityGuard` → `/inventory/*` | A | Preserve read-only dashboard and routes. |
| `maintenance.order.manage` | V2 / manage work order | — → — | U | Record missing maintenance module. |
| `usr.profile.read` | L / own profile | authenticated `GET /users/me` → `/app/profile` | P | Guard ERP route only. |

### 05 — System Administrator (29)

| Capability | Origin / operation | Current BE → FE | State | Minimal proposal |
|---|---|---|---|---|
| `adm.affiliates.read` | L / read affiliates | `GET /affiliates*`, `CapabilityGuard` → affiliates | A | Preserve read-only access. |
| `adm.assemblies.read` | L / read assemblies | assembly GET endpoints, `CapabilityGuard` → assemblies | A | Preserve. |
| `adm.institutional-board.read` | L / read board | board GET endpoints, `CapabilityGuard` → board | A | Preserve. |
| `adm.institutional-profile.read` | L / read profile | `GET /institutional-profile`, `CapabilityGuard` → institutional profile | A | Preserve. |
| `adm.justifications.read` | L / read justifications | justification GET endpoints, `CapabilityGuard` → admin justifications | A | Preserve. |
| `adm.requests.read` | L / read affiliate requests | `GET /affiliate-requests*`, `CapabilityGuard` → requests | A | Preserve. |
| `aud.logs.read` | L / read audit | `GET /audit-logs*`, `CapabilityGuard` → audit | A | Preserve. |
| `don.donations.read` | L / read donations | `GET /donations*`, `CapabilityGuard` → donations | A | Preserve read-only action set. |
| `ent.ventures.read` | L / read ventures | `GET /ventures*`, `CapabilityGuard` → ventures | A | Preserve read-only action set. |
| `erp.dashboard.read` | L / dashboard | `GET /admin-reports/dashboard`, `RolesGuard(Admin/system)` → admin dashboard | P | Replace nominal-only guard with explicit capability/domain-read contract or retain documented exception; never expose metrics broadly. |
| `fin.charges.read` | L / read charges | charge GET endpoints, `CapabilityGuard` → financial charges | A | Preserve. |
| `fin.dinadeco.read` | L / read report | annual report GET, `CapabilityGuard` → DINADECO | A | Preserve. |
| `fin.movements.read` | L / read movements | movement GET endpoints, `CapabilityGuard` → movements | A | Preserve. |
| `inv.inventory.read` | L / inventory read | inventory GET/report endpoints, `CapabilityGuard` → inventory | A | Preserve read-only controls. |
| `res.reservations.read` | L / read reservations | reservation GET endpoints, `CapabilityGuard` → reservations | A | Preserve; no lifecycle actions. |
| `system.audit.read` | V2 / read general audit | legacy audit uses another code → — | U | Do not duplicate/equate without approval. |
| `system.identity.manage` | V2 / manage identity | legacy user operations are split codes → — | U | Keep split operations authoritative. |
| `system.maintenance.operate` | V2 / operate backup | — → — | U | No maintenance UI/API. |
| `system.rbac.manage` | V2 / manage user role | legacy role-change uses another code → — | U | Do not collapse read/change/lifecycle into broad grant. |
| `usr.profile.read` | L / own profile | authenticated `GET /users/me` → `/app/profile` | P | Guard ERP route only. |
| `usr.roles.read` | L / read roles | `GET /roles`, `CapabilityGuard` → `/app/roles` placeholder | P | Remove/hide placeholder; report missing management screen, do not build one. |
| `usr.user-requests.read` | L / read account requests | `GET /user-requests*`, `CapabilityGuard` → requests | A | Preserve. |
| `usr.user-requests.review` | L / approve/reject account request | `PATCH /user-requests/:id/*`, `CapabilityGuard` → dialog actions | A | Preserve identity-review rules. |
| `usr.users.lifecycle.manage` | L / activate/deactivate | user lifecycle PATCH endpoints, `CapabilityGuard` → user actions | A | Preserve administrator-continuity restrictions. |
| `usr.users.read` | L / read users | `GET /users*`, `CapabilityGuard` → users | A | Preserve. |
| `usr.users.role.change` | L / change role | `PATCH /users/:id/role`, `CapabilityGuard` → user action | A | Preserve assignable-role and self-escalation rules. |
| `usr.users.unlock` | L / unlock | `PATCH /users/:id/unlock`, `CapabilityGuard` → user action | A | Preserve. |
| `usr.users.update` | L / update | user update PATCH endpoints, `CapabilityGuard` → user actions | A | Preserve. |
| `vol.opportunities.read` | L / read volunteering | opportunity/application GET endpoints, `CapabilityGuard` → volunteering | A | Preserve read-only action set. |

### 06 — Community User (0)

| Capability | Origin / operation | Current BE → FE | State | Minimal proposal |
|---|---|---|---|---|
| No institutional assignment | canonical zero-grant boundary | ERP denied by admission policy → `/mi-comunidad` and public/community routes | A | Preserve zero grants, public volunteering, profile and community services; add negative ERP/direct-API evidence. |

## Goals / Non-Goals

**Goals:**
- Establish reproducible traceability from each persisted role assignment to an implemented or explicitly unsupported operation.
- Correct authorization mismatches at the narrowest backend and frontend contract boundary.
- Keep backend enforcement authoritative and require action-level distinctions inside shared modules.
- Reuse approved dashboard and module surfaces while producing coherent role entry experiences.
- Make negative authorization evidence a release gate.

**Non-Goals:**
- Editing roles, permissions, `RolePermission`, seed grants, Prisma schema, migrations, or PostgreSQL data.
- Creating missing business modules, endpoints, accounting behavior, fictional dashboard data, or six role-specific dashboards.
- Inferring software permissions from institutional office, Affiliate state, labels, or similar capability names.
- Integrating, rebasing, merging, pushing, or importing historical branches, stashes, or worktrees.
- Certifying CU V2 mappings while immutable source evidence is unavailable.

## Decisions

### 1. Freeze evidence before correcting behavior

Start from the current branch and checkpoint, inspect the canonical export script and source catalogs, and produce one normalized 107-row working matrix. Each row records role, capability provenance (`legacy` or `v2`), CRUD/business verb, endpoint, effective guard, domain rule, route, screen/action, and status. If role counts differ from 16/24/26/12/29/0, stop and report drift instead of changing grants.

Alternative rejected: derive intended access from navigation, role labels, or module names. Those surfaces can already be wrong and cannot establish authorization authority.

### 2. Classify before mapping

Every assignment receives exactly one status: `ALIGNED`, `MISALIGNED`, or `UNSUPPORTED`. A mapping is valid only when capability semantics and the actual endpoint operation match; read, create, review, approve, update, publish, reverse, and manage remain distinct. `UNSUPPORTED` rows produce no new route or endpoint.

Alternative rejected: treat a broad or similarly named capability as equivalent. This can expose an entire module through one narrow grant.

### 3. Correct backend contracts before frontend exposure

For each `MISALIGNED` row, reconcile controller metadata and effective capability guards first, then verify service/use-case business-scope checks. Retain an existing role-name guard only when no approved capability equivalent exists, document it as transition debt, and do not expose it as canonical alignment. Authorization continues to use server-resolved persisted permission codes and default-deny recognition.

Alternative rejected: fix only Sidebar or route visibility. Hidden controls do not protect direct API calls.

### 4. Use one frontend access declaration per operation

After backend equivalence is proven, align route policy, navigation item, screen and action control to the same capability. Route guards protect deep links before protected data renders; screens hide or disable unavailable actions without treating that as security enforcement. Legacy role helpers may remain only for compatibility or presentation, never as new authorization authority.

Alternative rejected: role-specific route trees. They duplicate policy and drift when grants change.

### 5. Compose shared dashboards from authorized real data

Presidency and Secretariat use the approved administrative dashboard composition where its cards and links have implemented data sources and required capabilities. Treasury keeps the financial dashboard; Operator keeps the inventory experience. System Administrator reuses administrative surfaces for authorized supervision. No role gets a separate dashboard solely because it has a distinct role code.

Alternative rejected: six bespoke dashboards. This duplicates design and encourages fictional or role-hardcoded content.

### 6. Validate roles in fixed gates

Process Presidency, Secretariat, Treasury, Operator, System Administrator, then Community User. A role gate closes only after its matrix rows, allowed operations, denied operations, routes, Sidebar, dashboard and action controls are reviewed. Cross-role regression checks follow all six gates, with special coverage for administrator self-service restrictions and zero-grant community isolation.

Alternative rejected: module-only validation. It can miss conflicts where multiple roles share a screen but have different operation grants.

### 7. Keep implementation evidence separate from durable specification

The implementation closeout records traceability, corrected access, reused screens, unsupported capabilities, tests, modified files, risks, and GO/NO-GO. CU identifiers are attached only when supported by immutable evidence; otherwise their specification state remains `NOT_VERIFIED`. This evidence does not modify the RBAC matrix.

Alternative rejected: use the V2 catalog itself as proof that V1 code exists or that a rule is institutionally approved.

## Planned Source Files for APPLY

Only these files are authorized candidates from current evidence. APPLY must skip any file whose planned mismatch is disproved and must not expand to adjacent modules.

| File | Planned change |
|---|---|
| `backend/src/admin-reports/admin-reports.controller.ts` | Replace nominal-only dashboard authorization with explicit capability requirements for dashboard entry and every protected metric domain; keep unrelated report endpoints unchanged. |
| `backend/src/admin-reports/admin-reports.controller.spec.ts` | Cover allowed legacy/system administrator fixtures plus denial when dashboard or any protected metric capability is absent. |
| `backend/src/auth/presentation/guards/controller-capability-contracts.spec.ts` | Lock dashboard metadata and verify no V2 identifier is silently mapped to a legacy operation. |
| `frontend/src/app/router/AppRoutes.tsx` | Require `usr.profile.read` only on `/app/profile`; preserve community `/profile`; remove the non-functional `/app/roles` placeholder route. |
| `frontend/src/app/router/AppRoutes.test.tsx` | Cover direct profile access, missing capability, removed placeholder, community profile, and canonical role routes. |
| `frontend/src/app/navigation/erpNavigation.ts` | Align Profile navigation and entry fallback with implemented routes; keep unsupported V2 capabilities absent and personal assembly/justification links governed by their own contracts. |
| `frontend/src/app/navigation/erpNavigation.test.ts` | Assert six-role Sidebar snapshots from exact persisted fixtures, no empty groups, no unsupported V2 destinations, and correct Treasury/Operator entry. |
| `frontend/src/pages/erp/AppHomePage.tsx` | Reuse approved institutional welcome/shell composition for canonical institutional roles, keep Treasury/Inventory specialized summaries, and never request administrative metrics for roles lacking all metric capabilities. |
| `frontend/src/pages/erp/AppHomePage.test.tsx` | Cover Presidency, Secretariat, Treasury, Operator, System Administrator, and Community User dashboard outcomes and forbidden data requests. |
| `frontend/src/features/admin-dashboard/ui/AdminDashboard.tsx` | Extract/reuse only approved visual shell pieces needed by institutional entry; retain capability-filtered links/actions and keep administrative metrics restricted. |
| `frontend/src/features/admin-dashboard/ui/AdminDashboard.test.tsx` | Prove cards, actions, queries, and links follow capabilities and do not expose unauthorized metrics. |
| `frontend/src/features/admin-dashboard/index.ts` | Export only the reusable presentation boundary needed by `app/pages`; no feature-internal imports. |
| `frontend/src/features/auth/routing/RoleRoute.test.tsx` | Extend direct-route negative cases if new profile/entry combinations are not already covered. |
| `frontend/src/features/auth/routing/InternalErpRoute.test.tsx` | Lock zero-grant Community User exclusion and authenticated canonical ERP admission behavior. |
| `frontend/src/shared/security/access.ts` | No behavior change expected; edit only if traceability proves a recognized code missing. Never add a code to make an unsupported feature routable. |

Files explicitly excluded: `backend/prisma/**`, migrations, seed grant definitions, schema, identity/affiliate contracts, financial calculations, and every unsupported V2 module/controller listed in the matrix.

## APPLY Skills and Instructions

Activate in this order:

1. `sgi-pilot` — load repository stack, ownership, test-policy, and source-of-truth constraints.
2. `sgi-development-foundation` — verify branch/checkpoint/worktree, preserve architecture/default-deny, and enforce focused validation.
3. `sgi-frontend-architecture` — guard `app -> features -> shared`, public feature exports, route composition, and no new legacy-root code. Existing legacy files may receive only scoped compatibility edits.
4. `sgi-dashboard-ux` — reuse administrative, financial, and inventory dashboard composition without role-specific clones or route/auth changes outside matrix.
5. `sgi-frontend-design` — preserve Legends/SGI tokens, DM Sans/DM Serif, approved visual identity, and existing dashboard design; no redesign.
6. `sgi-responsive-accessibility` — validate keyboard, focus, semantics, `320/375/768/1024/1440` layouts, and protected-content loading behavior.
7. `baseline-ui` — final guardrail for spacing/hierarchy regressions only; it must not replace SGI visual identity.

Do not activate `sgi-forms-validation` unless APPLY unexpectedly changes a form, which this plan does not authorize. Do not activate motion tooling because no motion change is planned. Backend work follows `backend/AGENTS.md` and `docs/architecture/backend-layer-rules.md`; there is no approved skill that overrides those contracts.

## Risks / Trade-offs

- [Expected 107 assignments differ from current evidence] → stop alignment, report exact drift, and request an authorized matrix decision; do not repair persistence.
- [Capability wording is broader than implemented business semantics] → classify unsupported or narrow to proven operation; never grant broad module access.
- [Legacy and V2 identifiers coexist] → record provenance per row and preserve compatibility only where current contracts require it.
- [Shared screen leaks actions or data] → gate route, query/data section, and each mutation independently; verify direct API denial.
- [Changing a controller guard breaks a legacy role] → add positive fixtures for every currently authorized canonical profile and negative fixtures for adjacent capabilities before accepting the change.
- [Frontend route exists but API returns `403`] → classify route as misaligned; do not call it functional until backend and frontend contracts agree.
- [Global lint has known pre-existing findings] → run focused checks and record global results accurately; do not claim repository-wide success or repair unrelated debt.
- [Large cross-cutting diff becomes hard to review] → implement and review one role gate at a time while keeping one final cross-role matrix.

## Migration Plan

1. Confirm clean branch state, checkpoint, and comparison against `development`; do not merge or import other work.
2. Generate/read the canonical matrix through approved read-only evidence and freeze the 107-row traceability baseline.
3. Complete role gates in prescribed order, correcting backend before frontend within each gate.
4. Run focused positive/negative authorization tests after each gate, then frontend verify, backend tests/build, and final cross-role checks under repository test policy.
5. Inspect final diff for forbidden persistence changes and produce closeout evidence with GO/NO-GO.
6. Only after successful evidence review, create one implementation commit if explicitly authorized. Do not push or integrate automatically.

Rollback is application-code-only: revert the implementation commit through normal reviewed Git workflow. No data rollback exists or is needed because this change must not write persistence.
