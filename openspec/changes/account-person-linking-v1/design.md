# Design

## Context

See `proposal.md` and `specs/identity/account-person-linking/spec.md`. `User.personId` and `Affiliate.personId` are nullable unique relations. `BoardAppointment.personId` is a Person relation; it is not an account relation. Current Person-first evidence preserves nullable links while reconciliation Stage C remains incomplete and forbids automatic name, email, or identification matching.

`GET /users` is Person-rooted and separates `person.contactEmail` from `access.email`. Community self-service deliberately creates a pending User without `personId`. Existing user mutations govern access email, lifecycle, role and unlock operations, but no inspected HTTP contract authorizes an identity-link mutation or its audit event.

## Goals / Non-Goals

**Goals:**
- Preserve a single canonical Person and a one-to-zero-or-one User relation.
- Offer an identity-safe administrative read model that makes domain boundaries understandable.
- Define an explicit, transactional and auditable link operation with deterministic conflict behavior.
- Reuse existing lifecycle paths when a Person lacks an account.

**Non-Goals:**
- No automatic reconciliation, Person creation, identity-profile edit, affiliation change, appointment change, account transfer, role grant, email synchronization, credential/session/token change, Prisma migration or new public registration flow.
- `BOARD-UI-02 — Corregir flujo Sustituir nombramiento` remains backlog and is not changed by this proposal.

## Decisions

### 1. Treat link as a dedicated identity mutation

Introduce a dedicated protected operation rather than treating `User.personId` as part of generic account email update.

Rationale: a successful relation changes identity ownership and is materially different from editing access data. It needs purpose-built validation, audit and conflict semantics.

Alternative rejected: add `personId` to generic `PATCH /users/:id`. This would obscure intent, encourage account transfer semantics and risk reuse of the wrong capability/audit action.

### 2. Use explicit selection and confirmation only

The UI selects an unlinked User and a canonical Person from server-backed results, displays minimized evidence, then requires confirmation in a Base UI Dialog. The request carries selected IDs only; server independently checks authorization and current state.

Rationale: normalized identity is reconciliation evidence, not automatic authorization. Explicit selection is traceable and prevents a weak match becoming a binding.

Alternative rejected: preselect or auto-link by full name, email, identification, affiliate state, or board position.

### 3. Enforce both sides of the one-to-one relation transactionally

The backend loads User and Person in one transaction, verifies `User.personId IS NULL`, verifies no User references target Person, updates only the selected User relation, and maps unique/race failures to a conflict result. The database unique constraint remains final authority.

Rationale: read-before-write without transaction can race. The operation must never transfer an existing account relation or create partial state.

Alternative rejected: client-side conflict checks or best-effort sequential reads/writes.

### 4. Separate permission decision from existing account management

Read presentation may use established users-read authorization after confirming endpoint scope. Mutation requires an explicitly approved persisted capability and server guard; it MUST NOT be inferred from board, affiliate, role, or generic UI visibility. The approved capability code and canonical role grants are a security decision required before APPLY of the mutation.

Rationale: current contracts establish read/update/lifecycle/role/unlock separation but do not establish identity-link authority.

Alternative rejected: reuse `usr.users.update` without explicit security approval.

### 5. Preserve independent owners and audit successful links

The transaction writes only `User.personId` plus a successful audit event. It does not copy account email to Person, copy Person email to User, change Affiliate, GovernanceMembership/BoardAppointment, role, permission, state, password, token or session. Failed requests leave no success audit event.

Rationale: avoids accidental account transfer, privilege inference and profile mutation.

### 6. Reuse existing account lifecycle rather than inventing account creation

The Person-rooted status response can indicate no account and link only to actions already authorized by the deployed account lifecycle. If no administrative endpoint currently creates an account for an existing Person, UI renders guidance/state only until a separate lifecycle contract exists.

Rationale: community registration, legacy approval and activation have distinct safety semantics that cannot be merged by UI.

## Risks / Trade-offs

- [No approved persisted capability for identity link] → Block mutation APPLY; ship only read/presentation after endpoint authorization is verified.
- [Stage C Person-first reconciliation incomplete] → Do not run reconciliation, backfill null links or alter schema; permit only individually confirmed pairs once authorization exists.
- [Concurrent updates] → Use transaction, unique constraint and conflict mapping; cover race test against disposable PostgreSQL only when explicitly authorized.
- [Sensitive identity disclosure] → Return minimal display evidence and masked identification hints; never expose full values in lists or errors.
- [Mistaking board role for software authority] → Show labels by domain and never derive capability from appointment.

## Migration Plan

1. Obtain explicit security decision for mutation capability, canonical grants and audit action; reject APPLY mutation without it.
2. Add backend read and mutation contracts behind server authorization; no Prisma migration or backfill.
3. Add frontend Person-rooted status and confirmed linking Dialog only after HTTP contract exists.
4. Validate unit, HTTP, authorization, audit, conflict and authorized disposable-PostgreSQL concurrency evidence.
5. Roll back application code if needed; persisted links remain valid historical administrative decisions and must be remediated only through a separately authorized operation.

## Open Questions

- Which approved persisted capability and canonical grants authorize identity-link mutation? This changes authorization scope and must be approved before APPLY.
- Does a current protected lifecycle endpoint create or approve an account for an existing Person without creating another Person? Current inspection found no confirmed reusable contract; this must be established before exposing a creation action.
