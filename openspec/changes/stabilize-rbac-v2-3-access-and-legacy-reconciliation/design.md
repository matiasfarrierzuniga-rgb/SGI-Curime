# Design

## Context

See `proposal.md` for motivation. Current HEAD `62dc194` on `feat/p0-governance-inventory-rbac-v2-3` contains seven local commits over `origin/main`, including checkpoints `19988e4`, `de83b65`, `f55f3fc`, `ebfdaaa` and `62dc194`; `.archify/` is pre-existing untracked work and remains protected.

Six canonical roles and current grants are represented in code and were previously checked in PostgreSQL. Current code lists 26 grants for Secretariat, while older OpenSpec/report material references 24 and 105 total assignments. Those figures are historical evidence, not normative targets: functional responsibilities, approved current capabilities and the executable catalog determine the contract. Runtime authorization already resolves persisted permissions, but legacy `ROLE_CAPABILITIES` fixtures, `Affiliate.legacyRoleId`, role-change compatibility writes, user/auth projections and assembly snapshots still overlap.

Appointments already support create, edit, replace and revoke with transaction/audit boundaries. Their lifecycle does not grant software access, but no explicit privilege-review procedure follows appointment or term changes. Current PostgreSQL is development data: read-only inspection may recover evidence, but mutating verification requires a separately approved safe procedure.

## Goals / Non-Goals

**Goals:**

- Stabilize exact capability behavior without changing approved role composition.
- Certify persistence, backend, frontend and direct-navigation outcomes from one referenced acceptance matrix.
- Preserve recovered appointment and affiliation behavior while adding privilege-review orchestration around, not inside, governance-to-role inference.
- Remove productive authorization dependence on legacy affiliate role metadata in reversible stages.
- Produce one truthful integration decision and PR-ready scope against `main`.

**Non-Goals:**

- Physical column removal, schema cleanup, historical backfill or destructive migration.
- Automatic role assignment from office, affiliation or snapshots.
- Restoring retired UserRequest account approval.
- Resetting development data, creating disposable PostgreSQL, changing branches/worktrees, or integrating automatically.
- Reworking appointment behavior recovered at `f55f3fc` except for required review signaling and regression protection.

## Decisions

### 1. Functional contract and executable catalog outrank stale assignment counts

Use approved functional responsibilities and `canonical-role-grants.ts` as the current assignment source. Recover existing read-only evidence and compare capability identities and operation equivalence; counts are reported as observations, not forced targets. A material mismatch produces `NO-GO`; it does not trigger synchronization.

Alternative rejected: reduce or expand a role merely to match a historical count. This would disconnect RBAC from approved responsibilities and working operations.

### 2. One referenced acceptance matrix owns cross-layer status

Maintain one matrix artifact under this change, referenced by tasks and final evidence, with rows for role, capability, business operation, API/guard, route, navigation/dashboard/action, positive case, negative case and status (`ALIGNED`, `MISALIGNED`, `UNSUPPORTED`, `NOT_VERIFIED`). Documentation links to it instead of copying it.

Alternative rejected: repeat matrices in reports, READMEs and specs. Copies caused the current 24/26 drift.

### 3. Stabilization follows six reversible checkpoints

- **CP-01:** consolidate RBAC/Secretariat functional baseline and lock appointment/affiliation regressions.
- **CP-02:** align navigation, routes, dashboard, Events and Volunteering.
- **CP-03:** remove productive legacy authorization dependencies while retaining storage and historical readers.
- **CP-04:** add privilege-review procedure and audit evidence.
- **CP-05:** reconcile documentation and OpenSpec status.
- **CP-06:** execute non-destructive certification and prepare GO/NO-GO evidence.

Each checkpoint gets a scoped diff and rollback description. Git commits are prepared only if separately authorized; PROPOSE/APPLY authorization alone does not authorize commit, push, merge or rebase.

### 4. Backend operation equivalence is authoritative

For every surface, start from implemented business operation and backend capability metadata. Frontend navigation, routes and controls mirror that exact requirement. Persisted grants without equivalent operations remain non-routable.

Alternative rejected: map similar V2 names to broad legacy endpoints. Similar naming does not prove equivalent domain semantics.

### 5. Legacy role retirement uses expand/contract without physical contraction

CP-03 uses this sequence:

1. inventory every reader/writer of `Affiliate.legacyRoleId` and `ROLE_CAPABILITIES`;
2. classify authorization, compatibility, historical snapshot and test-fixture uses;
3. migrate authorization and current projections to persisted user role/permissions;
4. preserve assembly snapshot creation and historical reads until a replacement contract is certified;
5. stop unnecessary compatibility writes only after zero required reader evidence;
6. leave columns and historical values physically intact.

`ChangeUserRoleUseCase` remains the authoritative role mutation and session-protection boundary. Its current affiliate compatibility write is removed only when all required consumers have replacements; until then transaction atomicity remains mandatory.

Alternative rejected: remove `legacyRoleId` immediately because runtime RBAC no longer needs it. Assemblies, auth/user projections, tests and historical interpretation still consume it.

### 6. Privilege review is explicit and does not make appointments an RBAC source

Appointment revoke/replace, office correction and term conclusion produce a review trigger associated with affected `GovernanceMembership` and `Person`. Reviewers inspect linked account and effective persisted capabilities, then record one of:

- no linked account / no administrative access;
- access retained for independently legitimate responsibility;
- role change required;
- unresolved, requiring follow-up.

Use existing durable governance history plus sanitized audit events to record trigger and decision; derive unresolved review from an eligible lifecycle transition without a completed review event. A resulting role change invokes the existing protected user-role mutation, including session invalidation and its own audit. Appointment transaction never directly assigns or revokes a role.

Alternative rejected: store governance office → role mappings. This violates R2 and cannot represent independent legitimate authorizations.

### 7. Appointment history commits independently of access follow-up

A valid appointment end remains authoritative even if later privilege adjustment fails. Review state remains unresolved and visible to authorized operators. This prevents access-system failure from rewriting governance history while keeping the security follow-up explicit.

Alternative rejected: one transaction spanning appointment and role change. It couples domains and would make office transitions implicit authorization commands.

### 8. Documentation records authority and status, not duplicate implementation inventories

Canonical contracts state current behavior and link to current evidence. Historical OpenSpec/report material receives a clear historical or superseded marker without deletion. README/AGENTS changes remain concise pointers and guardrails; they do not embed the acceptance matrix.

### 9. Current PostgreSQL is protected by default

Allowed by default: source/tests inspection, migration-status inspection that does not mutate, and approved read-only queries that do not print sensitive values. Any test or command capable of writes against current PostgreSQL requires explicit human approval, identified scope, backup/recovery procedure and post-checks. No disposable replacement is created automatically.

### 10. Related OpenSpec status is explicit

`align-six-role-rbac-v2-access` remains historical planning/evidence for earlier role-gate work. Its 24-grant Secretariat and 105-assignment references are `SUPERSEDED` for current RBAC V2.3 decision-making; its completed-task evidence is retained. `reconcile-rbac-v2-authorization-contract` remains implementation evidence for catalog/admission/community transition with its own pending deployment certification. `reconcile-institutional-access-contract-v1` contains superseded community-`UserRequest` planning and is historical for that lifecycle, while its generic authorization evidence remains subject to current contracts. `account-person-linking-v1` is partial CP-04 evidence; `complete-person-first-identity-ownership-v1` remains partial planning for later identity reconciliation. None is archived or declared completed by this documentation alignment.

## Risks / Trade-offs

- [Previous PostgreSQL evidence may not match current data] → recover provenance and timestamp; classify current DB verification `NOT_EXECUTED` until safely authorized.
- [26-grant baseline contains unsupported capabilities] → retain grants but keep unsupported operations non-routable; do not fake implementation.
- [Removing compatibility write breaks assembly/user consumers] → inventory and migrate consumers before changing the writer; keep snapshots intact.
- [Audit-derived review state is less direct than a dedicated table] → define stable event names/details and focused query tests; propose a separate additive persistence change only if audit derivation proves insufficient.
- [Appointment review can remain unresolved] → expose unresolved state and make it a GO/NO-GO metric; never auto-revoke broad access.
- [Wide branch diff hides accidental files] → checkpoint-specific file lists, `git diff --check`, secret scan and final comparison against `origin/main`; preserve `.archify/` outside staged scope.
- [Historical OpenSpec contradicts current code] → mark status explicitly and preserve evidence rather than rewriting old task completion.
- [Full suites may write data or generate artifacts] → inspect commands first; run only non-destructive gates and report others `NOT_EXECUTED` pending approval.

## Migration Plan

1. Recover baseline evidence and create the single acceptance matrix; no writes.
2. Complete CP-01 and CP-02 application changes with focused tests and reversible diffs.
3. Complete CP-03 logical cutover while retaining all physical legacy storage.
4. Complete CP-04 privilege-review signaling, decision audit and session-safe role-change integration.
5. Complete CP-05 documentation status reconciliation after runtime contracts stabilize.
6. Execute CP-06 non-destructive gates; request human approval separately for any data-affecting check.
7. Declare `GO` only when all mandatory evidence passes; otherwise preserve checkpoints and report `NO-GO` blockers.
8. With separate authorization, prepare small commits and PR description toward `main`. Do not push or merge automatically.

Rollback is checkpoint-specific application rollback. No database rollback is expected because this change performs no physical removal, reset, seed or destructive migration. Any later physical cleanup requires a separate OpenSpec change and rollback/forward-repair design.
