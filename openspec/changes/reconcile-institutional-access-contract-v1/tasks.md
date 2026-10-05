## 1. Freeze Contract And Coverage Baseline

- [ ] 1.1 Inventory every public, authenticated, role-protected, and capability-protected account/auth endpoint and record its current URL, guard, actor outcome, audit event, and test evidence.
- [ ] 1.2 Build the canonical capability inventory for Dashboard, Users, Roles, Affiliates, Affiliate Requests, User Requests, Governance, Assemblies, Absence Justifications, Reservations, Events, Finance, Donations, Inventory, Reports, Institutional Profile, Entrepreneurship, and Volunteering.
- [ ] 1.3 Build the actor/module certification matrix using anonymous, general account, administrator-policy, treasurer-policy, inventory-manager-policy, and missing-capability actors without inferring governance mappings.
- [ ] 1.4 Add focused regression tests proving current UserRequest approval, inactive User creation, active Role validation, activation-token hashing/delivery, single-use activation, login, Session creation, and persisted permission resolution before changing entry points.
- [ ] 1.5 Add a scope guard or final diff checklist proving implementation does not modify Prisma schema/migrations, add persistent authorization models, add OTP/OAuth/OIDC, add dynamic RBAC administration, or map BoardPosition to software Role.

## 2. Close Public Account Lifecycle

- [ ] 2.1 Reconcile frontend registration form data with the existing UserRequest creation contract, including identity/contact snapshots, reason, validation, duplicate handling, and pending-review response state without requiring a Person link at submission.
- [ ] 2.2 Change public `/register` submission to create a UserRequest and confirm pending administrative review without creating a User, session, or authenticated frontend state.
- [ ] 2.3 Remove normal public reachability of direct active-User registration while preserving the separately controlled administrator bootstrap contract and its authentication rules.
- [ ] 2.4 Align public registration API/client types and error handling with UserRequest outcomes without changing unrelated routes or feature boundaries.
- [ ] 2.5 Verify administrative UserRequest review uses an explicit persisted review capability, safely resolves or reconciles a canonical Person before approval, validates selected active role ID server-side, preserves concurrency protection, and creates exactly one inactive Person-linked User plus activation token on approval.
- [ ] 2.6 Preserve rejection behavior, reviewer evidence, duplicate prevention, resolved-request conflict handling, and zero User/token creation on rejection.
- [ ] 2.7 Add frontend and backend tests for valid submission with safe Person link, valid submission without a Person link, duplicate User, duplicate pending request, review-time identity-resolution conflict, approval, rejection, and repeated review attempts.

## 3. Preserve And Complete Activation UX

- [ ] 3.1 Keep existing AccountActivationToken generation, SHA-256 persistence, configured expiration, email link delivery, and atomic claim/activation implementation unchanged except for integration fixes proven necessary.
- [ ] 3.2 Update activation frontend feedback to distinguish invalid/expired token, used token, ineligible or already-active account, password validation failure, and successful activation without client-side token truth assumptions.
- [ ] 3.3 Ensure successful activation clears password fields, offers login continuation, creates no session automatically, and never persists or logs raw token/password data.
- [ ] 3.4 Add focused activation route/page tests for missing query token, invalid token, expired token, reused token, already-active account, mismatched password, policy failure, successful activation, and safe retry behavior.
- [ ] 3.5 Verify pre-existing valid activation tokens and Sessions remain compatible after deployment with no conversion or database migration.

## 4. Standardize Backend Capability Enforcement

- [ ] 4.1 Reconcile backend capability policy and static seed mappings with the approved endpoint inventory; prefer existing canonical capabilities and record every endpoint/action, current role behavior, and mapped capability.
- [ ] 4.2 For every endpoint not correctly representable by an existing capability, document the missing-capability candidate, endpoint/action, and role behavior; stop that endpoint migration and request explicit product approval before adding any identifier, policy entry, or seed mapping.
- [ ] 4.3 Migrate UserRequest list/detail/approve/reject endpoints from hard-coded `Administrador` checks to existing explicit persisted capabilities and add `401`, `403`, allowed, inactive-role, and capability-without-role-name tests.
- [ ] 4.4 Migrate Affiliate and Affiliate Request administrative endpoints from hard-coded role checks to existing explicit read/review/manage capabilities while preserving public request creation and throttling.
- [ ] 4.5 Migrate Audit Log and administrative report endpoints from hard-coded role checks to existing explicit persisted read capabilities without broadening returned data.
- [ ] 4.6 Migrate Inventory categories, items, movements, loans, alerts, and reports from `Administrador`/`Gestor de Inventario` role-name checks to existing reviewed inventory capabilities while preserving verified access for both seeded roles.
- [ ] 4.7 Review sanctions and every remaining legacy `RolesGuard` use; migrate sensitive business access to an existing capability or record and test an explicit non-capability policy where role identity is genuinely part of the domain rule.
- [ ] 4.8 Review authentication-only endpoints, including reservable resources and self-service routes, and verify ownership/domain checks justify their classification rather than adding administrative capabilities by convenience.
- [ ] 4.9 Remove permanent mixed role-plus-capability enforcement from migrated sensitive endpoints and prove runtime decisions use server-resolved persisted `permissionCodes`.
- [ ] 4.10 Add controller/guard/integration tests proving direct API calls return `401` without valid authentication, `403` without capability, and success with capability independent of client-supplied role/permission claims.

## 5. Align Frontend Capability Contract

- [ ] 5.1 Reconcile frontend capability constants with the backend canonical inventory and remove or replace identifiers with no backend contract, including absence-justification naming drift.
- [ ] 5.2 Give every sensitive ERP navigation item and child item an explicit canonical capability or a documented authentication-only classification.
- [ ] 5.3 Add an explicit UserRequest review navigation/route policy separate from Affiliate Request policy and align it with the backend review capability.
- [ ] 5.4 Resolve authentication before ERP content renders; keep the shell capability-neutral, protect `/app/dashboard` specifically with `erp.dashboard.read`, and make bare ERP entry redirect to a first authorized child route or render no-administrative-access behavior when none exists.
- [ ] 5.5 Give every sensitive frontend route explicit capability protection and ensure manual deep links deny before protected components issue data requests or render protected content.
- [ ] 5.6 Review profile, personal assemblies, reservation request, and personal absence-justification routes; retain authentication-only access only when matched by backend ownership rules and tests.
- [ ] 5.7 Align page-level and component-level action controls for create, update, approve, reject, cancel, delete, lifecycle, unlock, role assignment, publication, payment, and management actions with their API capabilities.
- [ ] 5.8 Preserve frontend `401` handling as session-refresh/login behavior and `403` handling as forbidden/access-refresh behavior without clearing valid sessions or creating retry loops.
- [ ] 5.9 Add navigation, route, action, and HTTP tests for allowed capability, missing capability, unknown capability, anonymous access, restoration loading, changed persisted access, deep links, and no unauthorized-content flash.

## 6. Preserve Software Role And Governance Boundaries

- [ ] 6.1 Verify no authorization guard, navigation rule, route guard, or capability derivation reads BoardPosition, GovernancePosition, board appointment labels, or affiliate legacy role snapshots.
- [ ] 6.2 Preserve software Role assignment through validated active role IDs and retain administrator continuity, self-deactivation, lifecycle, and unlock safeguards.
- [ ] 6.3 Preserve existing seeded software roles without inventing capabilities for `Vecino/Afiliado`, `Miembro de Junta Directiva`, or `Subscription_L1`; escalate any required mapping as a separate product decision.
- [ ] 6.4 Add tests proving governance office titles grant no software access and that software `Tesorero` access comes only from its persisted RolePermission assignments.
- [ ] 6.5 Verify no Role CRUD, Permission CRUD, RolePermission mutation API, or corresponding frontend administration UI is introduced.

## 7. Verify Sensitive Audit Coverage

- [ ] 7.1 Verify UserRequest creation, approval, rejection, User creation, account activation, role assignment, lifecycle changes, unlock, login, logout, refresh, and session revocation retain expected audit events.
- [ ] 7.2 Verify approval and activation audits contain actor/entity/context evidence where applicable and sanitize raw activation tokens, passwords, JWTs, refresh tokens, and secrets.
- [ ] 7.3 Verify migrated controller guards do not bypass existing business-service audit paths for successful sensitive mutations.
- [ ] 7.4 Add or refine audit tests for account approval, rejection, activation, role change, lifecycle operations, and representative finance/inventory/governance administrative mutations.
- [ ] 7.5 Record dynamic role/permission mutation audit as not applicable because administration remains out of scope; do not add placeholder mutation events.

## 8. Actor-Based Authorization Certification

- [ ] 8.1 Extend backend auth fixtures so actor permission sets are loaded through production-shaped RolePermission relations rather than trusted JWT/body permission claims.
- [ ] 8.2 Certify account lifecycle actors across public request, administrative review, activation, login, current-user resolution, denied review, and replay/error cases.
- [ ] 8.3 Certify Dashboard, Users, Roles, Affiliates, Affiliate Requests, User Requests, Governance, Assemblies, Absence Justifications, Reservations, and Events across navigation, direct route, API, and key action layers.
- [ ] 8.4 Certify Finance, Donations, Inventory, Reports, Institutional Profile, Entrepreneurship, and Volunteering across navigation, direct route, API, and key action layers.
- [ ] 8.5 Prove anonymous protected access yields frontend login behavior and backend `401`, while authenticated missing-capability access yields frontend forbidden behavior and backend `403` without session loss.
- [ ] 8.6 Prove users cannot obtain access by editing sessionStorage, route state, request role fields, permission fields, or governance-position data.
- [ ] 8.7 Record intentionally public and authentication-only endpoints in certification evidence and prove they expose only their intended scope.

## 9. Verification And Release Gate

- [ ] 9.1 Run focused backend unit/integration tests for UserRequest, activation, login/session, capability policy/guard, migrated controllers, user role/lifecycle, and audit behavior; record actual results.
- [ ] 9.2 Run focused frontend tests for registration, activation, AuthContext, HTTP `401`/`403`, navigation filtering, protected routes, deep links, and capability-aware actions; record actual results.
- [ ] 9.3 Have the human operator run approved database-mutating E2E suites only against disposable test state and record evidence without claiming success before execution.
- [ ] 9.4 Run backend and frontend lint, architecture, type/build, and applicable verification gates; resolve only failures caused by this change and report unrelated debt separately.
- [ ] 9.5 Inspect final source and Git diff to prove no Prisma schema/migration, persistent authorization model, OAuth/OIDC, numeric OTP, dynamic RBAC administration, governance-role mapping, or unrelated visual redesign was added.
- [ ] 9.6 Verify the final three-layer module matrix has no sensitive capability marked secure solely by hidden navigation and no backend sensitive endpoint left unintentionally role-name-only or unprotected.
- [ ] 9.7 Verify rollback remains application-only, existing activation tokens/Sessions remain valid, and frontend/backend account-policy changes are deployable as one compatible release.
- [ ] 9.8 Mark V1 institutional access reconciliation complete only when lifecycle, capability alignment, audit evidence, actor certification, and all preservation constraints pass.
