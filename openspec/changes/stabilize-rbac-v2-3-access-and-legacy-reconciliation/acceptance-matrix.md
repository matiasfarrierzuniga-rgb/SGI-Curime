# Acceptance and Evidence Matrix

This is the single acceptance-status index for this change. It is not the canonical role-grant catalog: `backend/src/auth/domain/policies/canonical-role-grants.ts`, approved functional responsibilities and current persistence define assignments.

Statuses: `NOT_VERIFIED`, `NOT_EXECUTED`, `ALIGNED`, `MISALIGNED`, `UNSUPPORTED`, `BLOCKED`.

## Canonical functional roles

| Role | Approved responsibility | Current catalog observation | Source contract | Status |
| --- | ---: | --- | --- | --- |
| `ROLE_SYSTEM_ADMIN` | Technical accounts, RBAC, sessions, security and audit | Code currently lists 27 grants; persistence recheck pending | `canonical-role-grants.ts` | NOT_VERIFIED |
| `ROLE_INSTITUTIONAL_PRESIDENT` | Institutional direction and authorized supervision | Code currently lists 16 grants; persistence recheck pending | `canonical-role-grants.ts` | NOT_VERIFIED |
| `ROLE_INSTITUTIONAL_SECRETARY` | Documentation, assemblies, affiliations and appointments | Code currently lists 26 grants; historical 24 reference is superseded | `canonical-role-grants.ts` | NOT_VERIFIED |
| `ROLE_INSTITUTIONAL_TREASURER` | Authorized financial operations and reporting | Code currently lists 26 grants; persistence recheck pending | `canonical-role-grants.ts` | NOT_VERIFIED |
| `ROLE_INSTITUTIONAL_OPERATOR` | Authorized inventory and community operations | Code currently lists 12 grants; operation equivalence pending | `canonical-role-grants.ts` | NOT_VERIFIED |
| `ROLE_COMMUNITY_USER` | Community account and services without ERP admission by authentication alone | Code currently lists zero ERP grants; persistence recheck pending | `account-lifecycle-v1.md` | NOT_VERIFIED |

## Checkpoint acceptance

| Checkpoint | Required evidence | Protected baseline | Status |
| --- | --- | --- | --- |
| CP-01 RBAC and Secretariat | Capability identities and approved functional responsibilities; appointment create/edit/replace/revoke; affiliation request list/detail/approve/reject; affiliate read/manage; API `401/403/allow` | Six roles; recovered appointment behavior; no count-driven rollback | NOT_VERIFIED |
| CP-02 Navigation and dashboard | `erpNavigation`, `AppRoutes`, Sidebar, dashboard, Events and Volunteering route/action/API positive and negative cases | No new grants; public Events/Volunteering preserved | NOT_VERIFIED |
| CP-03 Legacy retirement | Reader/writer inventory; replacement source per consumer; role-change/session/audit regression; assembly snapshot compatibility | Historical fields and snapshots retained | NOT_VERIFIED |
| CP-04 Privilege validity | Trigger, unresolved state, retain/reduce decisions, unauthorized reviewer, session protection and audit | R1, R2 and R3; no office→role mapping | NOT_VERIFIED |
| CP-05 Documentation | Authority/status review; no duplicated full matrix; historical markers and CU traceability | Historical evidence not deleted | ALIGNED — documentation-only review; runtime certification remains NOT_EXECUTED |
| CP-06 Main readiness | Backend/frontend tests, typecheck, lint, builds, architecture, strict OpenSpec, diff/secret/scope review and functional role gates | Checkpoints and `.archify/` preserved | NOT_VERIFIED |

## Operation evidence rows

APPLY SHALL expand these rows only where an implemented operation exists. Unsupported capability names remain explicit rows without invented routes.

| Role | Capability | Business operation | API/guard | Route/surface/action | Positive evidence | Negative evidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Secretariat | `adm.institutional-board.read` | Read terms, appointments and candidates | Pending | `/app/admin/institutional-board` | Pending | Pending | NOT_VERIFIED |
| Secretariat | `adm.institutional-board.manage` | Create/edit/replace/revoke appointments and terms | Pending | Board management actions | Pending | Pending | NOT_VERIFIED |
| Secretariat | `padron.application.review` | List/detail/approve/reject affiliation requests | Pending | `/app/admin/requests` | Pending | Pending | NOT_VERIFIED |
| Applicable roles | Event capabilities | Exact create/review/approve/publish operations | Pending | `/app/events` and actions | Pending | Pending | NOT_VERIFIED |
| System Administrator | `vol.opportunities.read` | Read administrative volunteering opportunities | Pending | `/app/admin/volunteering` | Pending | Pending | NOT_VERIFIED |
| Public visitor | None | Read public Events and Volunteering; submit allowed volunteer application | Public contracts | `/eventos`, `/voluntariado` | Pending | N/A | NOT_VERIFIED |
| Role manager | `usr.users.role.change` | Change software role with session protection and audit | Pending | User role action | Pending | Pending | NOT_VERIFIED |
| Privilege reviewer | Approved management capabilities | Review access after governance lifecycle trigger | Pending | Authorized review surface | Pending | Pending | NOT_VERIFIED |

## Use-case traceability

No immutable local V2 use-case catalog was provided for this documentation alignment. All role, appointment, affiliation, navigation and legacy-retirement mappings remain `NOT_VERIFIED`; no CU identifier is presented as implementation or authorization evidence.

## CP-05 affected documents and rollback

Updated: root, backend and frontend `README.md`; root/backend/frontend `AGENTS.md`; `docs/README.md`; `docs/contracts/account-lifecycle-v1.md`; `docs/modules/institutional-board.md`; this successor change; and explicit historical markers in `align-six-role-rbac-v2-access` proposal/design/tasks. Rollback is application-independent: revert only these documentation files in a separately authorized Git operation. No API, database, grant, schema or historical data change is part of CP-05.

## GO / NO-GO

`GO` requires every mandatory checkpoint row `ALIGNED`, every required command `PASSED`, no unexplained baseline drift, no privilege expansion, no historical-data loss, clean intended Git scope and explicit acceptance of residual risks. Any required `MISALIGNED`, `BLOCKED`, failing check or unsafe `NOT_EXECUTED` certification remains `NO-GO`.
