## 1. Stage A — Contract, Matrix, And Decision Gates

- [x] 1.1 Freeze complete ownership matrix for Person, User, Affiliate, UserRequest, AffiliateRequest, VolunteerApplication, Donation, and every Person-linked model; record each field’s category, owner, current reader, current writer, API exposure, action, and risk.
- [x] 1.2 Inventory and version User/Affiliate/request API contracts, frontend types/forms, backend DTOs, tests, and downstream consumers for each legacy duplicate and snapshot alias.
- [x] 1.3 Record and approve canonical Person read/write contract, compatibility projection policy, snapshot retention policy, and User-email separation: User.email only for login/access; retained Person.email only independent personal/contact data; no bidirectional auto-sync or registration copy; explicit personal-contact/profile writes only.
- [x] 1.4 Record frozen gender policy: future Person.gender target if retained; Affiliate.gender legacy/transitional duplicate. Inventory all gender readers/writers and define conflict reconciliation evidence; later Person schema addition requires separate approval.
- [x] 1.5 Define approval gate, evidence format, and rollback owner for every stage; confirm no production/schema change starts before Stage A approval.

## 2. Stage B — Preflight, Snapshots, And Compatibility

- [ ] 2.1 Produce normalized-identification preflight inventory grouped by identification type: safely linked, null personId, duplicate candidate, conflict, incomplete, and insufficient evidence.
- [ ] 2.2 Define duplicate/conflict quarantine and human-review workflow using source snapshots and IdentityReconciliationManifest evidence; prohibit silent merges/overwrites.
- [ ] 2.3 Design additive request snapshot migration from generic fields to explicit `submitted*` fields, with direct-copy backfill, aliases, API versions, deprecation dates, and no arbitrary fullName parsing.
- [ ] 2.4 Define compatibility Person-backed projections for User/Affiliate reads while preserving separate User access email and historical snapshots; separately document DB versus API compatibility, temporary Person API projections, and any actual external consumer required for V1.1.
- [ ] 2.5 Rehearse backup, transaction-failure, idempotent rerun, and rollback procedures against disposable data; record evidence.
- [ ] 2.6 At Stage B checkpoint, reapply/reconcile preserved `reconcile-institutional-access-contract-v1` Phase B WIP/stash against approved Person-first rules; do not treat preserved WIP as canonical before this task.

## 3. Stage C — Reconciliation And Additive Schema Work

- [ ] 3.1 Implement transactional resolver/link reconciliation using normalized identification and preflight classifications; persist review evidence for exceptions.
- [ ] 3.2 Reconcile null Person links and evidence-backed profile completeness without copying email, auto-syncing either email direction, registration copying, mutating submitted snapshots, or overwriting gender conflicts; keep UserRequest/AffiliateRequest personId nullable until approval/final domain creation resolves Person.
- [ ] 3.3 Add only approved additive schema relations, indices, explicit submitted snapshot fields, future Person.gender only after later approval, and GovernanceMembership Person relation/semantic rename support; retain legacy data and aliases.
- [ ] 3.4 Add focused migration/resolver tests for duplicate identities, conflicts, null links, malformed IDs, transaction races, retry idempotency, and rollback/forward-repair paths.
- [ ] 3.5 Certify 100% safe User/Affiliate linking, zero nulls/conflicts, normalized uniqueness, preflight, rollback evidence, reconciliation population, and exception queue before proposing final Person-link non-null constraints; do not guess links.

## 4. Stage D — Canonical Read, Write, API, And Frontend Cutover

- [ ] 4.1 Migrate User and Affiliate live personal reads, including retained gender, to declared Person projections while retaining User email as the only access-account email and retaining Affiliate gender compatibility until certified.
- [ ] 4.2 Route migrated User/Affiliate personal mutations through canonical Person writes; preserve affiliation and account lifecycle fields in their existing owners; permit Person.email writes only through explicit personal-contact/profile flow.
- [ ] 4.3 Release versioned request snapshot APIs exposing explicit submitted names plus certified compatibility aliases; migrate backend DTOs and frontend clients/forms.
- [ ] 4.4 Update User/Affiliate/request frontend types, forms, lists, details, validation, loading/error states, and tests without reading current identity from snapshots.
- [ ] 4.5 Test staged API compatibility, account-email separation/no email synchronization, Person projection behavior, request/history immutability, authorization, and declared consumer migration before deprecating aliases; open V1.1 only for documented external consumer.

## 5. Stage E — Certification, Constraints, And Controlled Retirement

- [ ] 5.1 Certify zero productive legacy readers/writers, Person-derived mapping, reconciliation independence, and no frontend legacy semantics for each removal candidate: User/Affiliate duplicate fields including gender, Person.legacyFullName, generic request aliases, GovernanceMembership legacy relation scalar, and retained Person.email if no productive independent use remains.
- [ ] 5.2 Certify normalized-ID uniqueness, zero nulls/conflicts before final User/Affiliate non-null links, null-link disposition for intentionally nullable requests, duplicate/conflict disposition, transaction behavior, DB/API compatibility migration, snapshots, backups, rollback, operations runbook, focused backend/frontend tests, build, and E2E.
- [ ] 5.3 Propose non-null links, uniqueness constraints, API alias removal, and duplicate-column removal only as separately approved destructive migration batches with tested rollback or forward-repair.
- [ ] 5.4 Execute focused backend/frontend/migration verification and have human operator execute database-mutating suites against disposable state; record actual results.
- [ ] 5.5 Review final diff/schemas/contracts to prove no snapshot loss, arbitrary fullName parsing, User-email synchronization, unapproved gender/email policy, or unrelated Phase B modification occurred.
