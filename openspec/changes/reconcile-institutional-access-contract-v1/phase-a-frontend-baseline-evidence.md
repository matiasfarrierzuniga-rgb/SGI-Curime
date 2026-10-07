# Phase A — Frontend Baseline Evidence

**Scope:** current frontend evidence only. This file records observed identifiers, navigation, and route behavior. It neither changes production behavior nor proposes new capability identifiers or role mappings.

**Evidence sources:**

- `frontend/src/shared/security/access.ts`
- `frontend/src/app/navigation/erpNavigation.ts`
- `frontend/src/app/router/AppRoutes.tsx`
- `frontend/src/features/auth/routing/{ProtectedRoute,InternalErpRoute,RoleRoute}.tsx`
- `frontend/src/pages/erp/AppHomePage.tsx`
- existing frontend tests cited below

## 1. Current frontend authorization inputs

- `AuthenticatedUser` carries `canAccessErp` and server-delivered `permissionCodes: string[]` (`features/auth/model/auth.types.ts`).
- Navigation filters only on `permissionCodes` through `hasCapability`; existing test proves a role-name string does not reveal capability-gated navigation (`app/navigation/erpNavigation.test.ts`).
- `RoleRoute` requires authenticated state, `canAccessErp === true`, and its supplied capability. Current denied outcome is `/403`.
- `InternalErpRoute` restores before content, sends anonymous actors to `/login`, and sends users with no delivered permissions to `/servicios`.
- `ProtectedRoute` is authentication-only for `/profile` and `/servicios/reservas`; it preserves requested location for login.
- These browser checks are UX/route controls. Backend enforcement remains authoritative per `shared/security/access.ts` comment.

## 2. Current capability and route inventory

`ACCESS_CAPABILITIES` currently declares these identifiers. “Navigation” identifies ERP navigation visibility; “route” identifies direct route protection observed in `AppRoutes`.

| Requested module | Current frontend capability identifiers | Navigation / current route(s) | Baseline classification |
| --- | --- | --- | --- |
| Dashboard | `erp.dashboard.read` declared only | `Inicio` is unguarded `/app`; no `/app/dashboard` route | Drift: declared capability not used by current dashboard route/navigation |
| Users | `usr.users.read` | nav `/admin/users`; `RoleRoute(usr.users.read)` | capability-gated |
| Roles | `usr.roles.read` | no nav item; `/app/roles` placeholder guarded by `usr.roles.read` | route-only capability-gated |
| Affiliates | `adm.affiliates.read` | nav `/app/admin/affiliates`; matching route guard | capability-gated |
| Affiliate Requests | `adm.requests.read` | nav `/app/admin/requests`; matching route guard | capability-gated |
| User Requests | no distinct declared identifier | no nav item; `/admin/user-requests` is grouped under `RoleRoute(adm.requests.read)` | Drift: shares Affiliate Request capability; separate review policy not evidenced |
| Governance | `adm.institutional-board.read`, `adm.institutional-board.manage` | nav `/app/admin/institutional-board`; route requires `.read`; page checks `.manage` for mutations | capability-gated; no governance-to-role inference in navigation/route policy |
| Assemblies | `adm.assemblies.read`, `adm.assemblies.manage` | nav `/app/admin/assemblies`; admin list/detail routes require `.read`; `/app/assemblies/mine` remains unguarded inside ERP shell | admin routes capability-gated; personal route authentication/ERP-shell-only |
| Absence Justifications | `adm.justifications.read`, `.approve`, `.reject`; also `abs.justifications.read` | nav/admin route use `adm.justifications.read`; personal create/list routes unguarded inside ERP shell | Naming drift: `abs.justifications.read` declared but not used in routes/navigation |
| Reservations | `res.reservations.read`, `.approve`, `.reject`, `.cancel` | nav/admin route uses `.read`; `/servicios/reservas` uses `ProtectedRoute` only | admin capability-gated; request route authentication-only |
| Events | `pub.events.manage`, `pub.events.publish` | nav `/app/events`; route requires `.manage`; public `/eventos` and `/eventos/:publicId` are public | management capability-gated; public browse explicit public |
| Finance | `fin.charges.read`, `fin.payments.record`, `fin.movements.read`, `fin.movements.create`, `fin.dinadeco.read` | finance parent resolves to first visible child; three child routes require each read capability | capability-gated by child; payment/create actions separately check action identifiers |
| Donations | `don.donations.read`, `.create`, `.update`, `.cancel`, `.delete` | nav `/app/donations`; route requires `.read`; page actions check operation identifiers | capability-gated |
| Inventory | `inv.inventory.read` | nav `/inventory` plus children; all listed inventory routes share `.read` guard | capability-gated route group; children contain no explicit child capability |
| Reports | `aud.logs.read`, `fin.dinadeco.read`, `inv.inventory.read` | audit nav/route; DINADECO finance child; inventory reports child | three current report surfaces; no common report capability |
| Institutional Profile | `adm.institutional-profile.read`, `.update` | nav/admin route requires `.read`; page actions use `.update` | capability-gated |
| Entrepreneurship | `ent.ventures.read`, `.create`, `.update` | nav/admin route `.read`; page actions `.create`/`.update` | capability-gated |
| Volunteering | `vol.opportunities.read`, `.create`, `.update` | nav/admin route `.read`; page actions `.create`/`.update` | capability-gated |

Additional current navigation facts:

- `Mi perfil` (`/app/profile`), personal absence-justification routes, and `Mis asambleas` have no navigation capability. They require passage through `InternalErpRoute`; `/profile` is separately protected with `ProtectedRoute`.
- ERP navigation has no items for Roles or User Requests.
- Finance parent has no own capability; it is visible only when at least one capability-gated child is visible, then targets first visible child.
- Inventory parent has `.read`; its child links declare no individual capability and inherit the route group’s `.read` guard.

## 3. Actor/module certification matrix — frontend baseline

### Actor definitions and outcome legend

No role-to-capability mapping is inferred here. “administrator-policy”, “treasurer-policy”, and “inventory-manager-policy” are fixture labels only. Their frontend outcome is determined exclusively by the actual delivered `permissionCodes` and `canAccessErp`, not a software-role label, board office, governance position, affiliate legacy role snapshot, or client-provided route state.

| Symbol | Navigation | Direct route |
| --- | --- | --- |
| `P` | public / no ERP navigation needed | public route renders |
| `AUTH` | no module navigation guarantee | authenticated route allowed under current guard |
| `C(code)` | visible only when delivered permission set contains `code` | allowed only with ERP eligibility plus `code`; otherwise `/403` after ERP shell admission |
| `LOGIN` | not applicable | anonymous protected access redirects to `/login` before protected content |
| `NO-ERP` | sensitive navigation absent | `InternalErpRoute` redirects an authenticated no-permission general account to `/servicios` |
| `PENDING` | no role-label result may be certified | requires backend RolePermission evidence; not guessed from actor label |

| Module / layer | Anonymous | General account (no permissions) | Administrator-policy | Treasurer-policy | Inventory-manager-policy | Missing-capability actor (ERP eligible) |
| --- | --- | --- | --- | --- | --- |
| Dashboard `/app` | `LOGIN` | `NO-ERP` | `PENDING` — current route unguarded after ERP admission | `PENDING` | `PENDING` | Current route renders after ERP admission; no explicit dashboard capability check |
| Users | `LOGIN` | `NO-ERP` | `C(usr.users.read)` | `C(usr.users.read)` | `C(usr.users.read)` | `/403` |
| Roles | `LOGIN` | `NO-ERP` | `C(usr.roles.read)` | `C(usr.roles.read)` | `C(usr.roles.read)` | `/403` |
| Affiliates | `LOGIN` | `NO-ERP` | `C(adm.affiliates.read)` | `C(adm.affiliates.read)` | `C(adm.affiliates.read)` | `/403` |
| Affiliate Requests | `LOGIN` | `NO-ERP` | `C(adm.requests.read)` | `C(adm.requests.read)` | `C(adm.requests.read)` | `/403` |
| User Requests | `LOGIN` | `NO-ERP` | `C(adm.requests.read)` current shared policy only | `C(adm.requests.read)` current shared policy only | `C(adm.requests.read)` current shared policy only | `/403` |
| Governance / board | `LOGIN` | `NO-ERP` | `C(adm.institutional-board.read)` | `C(adm.institutional-board.read)` | `C(adm.institutional-board.read)` | `/403` |
| Assemblies admin | `LOGIN` | `NO-ERP` | `C(adm.assemblies.read)` | `C(adm.assemblies.read)` | `C(adm.assemblies.read)` | `/403` |
| Assemblies personal | `LOGIN` | `NO-ERP` | `AUTH` after ERP admission | `AUTH` after ERP admission | `AUTH` after ERP admission | `AUTH` after ERP admission |
| Absence Justifications admin | `LOGIN` | `NO-ERP` | `C(adm.justifications.read)` | `C(adm.justifications.read)` | `C(adm.justifications.read)` | `/403` |
| Absence Justifications personal | `LOGIN` | `NO-ERP` | `AUTH` after ERP admission | `AUTH` after ERP admission | `AUTH` after ERP admission | `AUTH` after ERP admission |
| Reservations admin | `LOGIN` | `NO-ERP` | `C(res.reservations.read)` | `C(res.reservations.read)` | `C(res.reservations.read)` | `/403` |
| Reservation request | `LOGIN` | `AUTH` | `AUTH` | `AUTH` | `AUTH` | `AUTH` |
| Events management | `LOGIN` | `NO-ERP` | `C(pub.events.manage)` | `C(pub.events.manage)` | `C(pub.events.manage)` | `/403` |
| Events public browse/detail | `P` | `P` | `P` | `P` | `P` | `P` |
| Finance charges | `LOGIN` | `NO-ERP` | `C(fin.charges.read)` | `C(fin.charges.read)` | `C(fin.charges.read)` | `/403` |
| Finance movements | `LOGIN` | `NO-ERP` | `C(fin.movements.read)` | `C(fin.movements.read)` | `C(fin.movements.read)` | `/403` |
| Finance DINADECO report | `LOGIN` | `NO-ERP` | `C(fin.dinadeco.read)` | `C(fin.dinadeco.read)` | `C(fin.dinadeco.read)` | `/403` |
| Donations | `LOGIN` | `NO-ERP` | `C(don.donations.read)` | `C(don.donations.read)` | `C(don.donations.read)` | `/403` |
| Inventory and inventory reports | `LOGIN` | `NO-ERP` | `C(inv.inventory.read)` | `C(inv.inventory.read)` | `C(inv.inventory.read)` | `/403` |
| Audit report | `LOGIN` | `NO-ERP` | `C(aud.logs.read)` | `C(aud.logs.read)` | `C(aud.logs.read)` | `/403` |
| Institutional Profile | `LOGIN` | `NO-ERP` | `C(adm.institutional-profile.read)` | `C(adm.institutional-profile.read)` | `C(adm.institutional-profile.read)` | `/403` |
| Entrepreneurship | `LOGIN` | `NO-ERP` | `C(ent.ventures.read)` | `C(ent.ventures.read)` | `C(ent.ventures.read)` | `/403` |
| Volunteering | `LOGIN` | `NO-ERP` | `C(vol.opportunities.read)` | `C(vol.opportunities.read)` | `C(vol.opportunities.read)` | `/403` |

**Certification limits:** this is frontend baseline evidence. It does not certify backend API `401`/`403`, database-persisted RolePermission assignments, audit events, or action-level API enforcement. Those require Forge-owned evidence and focused backend tests. `C(code)` confirms current frontend decision rule only, not assignment of code to any named actor.

## 4. Existing focused frontend test evidence

- `app/navigation/erpNavigation.test.ts`: delivered permission filtering, no role-name authorization input, finance child visibility/first-authorized-child behavior.
- `features/auth/routing/InternalErpRoute.test.tsx`: restoration state prevents internal content, anonymous deep-link denial, valid permission-bearing session admission.
- `features/auth/routing/RoleRoute.test.tsx`: capability allow/deny, unknown capability denial, inventory-manager fixture denial without `usr.users.read`, capability-free route behavior.
- `app/router/AppRoutes.test.tsx`: anonymous login redirects, general-account ERP denial, capability-gated deep links for users, affiliate requests, finance, donations, DINADECO, institutional profile, events, audit, and volunteering; several tests assert target content is not requested/rendered before authorization.

## 5. Baseline gaps and product/contract decision candidates

These are observations, not changes or inferred mappings:

1. **UserRequest review policy:** `/admin/user-requests` currently shares `adm.requests.read` with Affiliate Requests and has no navigation item. Phase D requires an explicit review navigation/route policy, but Phase A evidence cannot select an existing or new identifier.
2. **Dashboard policy:** `erp.dashboard.read` is declared but not consumed. Current `/app` dashboard has no explicit route capability. `AppHomePage` additionally uses role-name conditions for dashboard blocks and inventory summary; reconcile only after backend canonical policy evidence.
3. **Absence-justification drift:** `abs.justifications.read` exists in frontend constant list while current route/navigation use `adm.justifications.read`. Backend canonical inventory must decide; do not map by name guesswork.
4. **ERP admission vs child policy:** `InternalErpRoute` admits any nonempty permission set and redirects an empty set to services. Personal ERP-shell routes are not individually capability-protected. Backend ownership policy must confirm authentication-only intent before frontend changes.
5. **Inventory route granularity:** one `inv.inventory.read` protects every current inventory child including reports. Do not invent granular identifiers.
6. **Governance boundary:** no frontend navigation or route derives access from a governance position. Maintain this boundary; a board/governance title must not be used as a substitute for delivered `permissionCodes`.

## 6. Phase-A scope assertion

- No production frontend source, Prisma schema, migration, backend controller/service, registration behavior, OAuth/OIDC, OTP, dynamic RBAC UI, governance-to-Role mapping, or capability identifier changed by this evidence task.
- No new capability identifier is proposed as approved. Items above are decision candidates only, pending canonical backend inventory and product authorization where required.
