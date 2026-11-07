# Design

## Context

See `proposal.md` for motivation and `specs/architecture/agent-instruction-governance/spec.md` for normative behavior.

Current governance is distributed across three tracked `AGENTS.md` files, `frontend/CONVENTIONS.md`, `CONTRIBUTING.md`, local SGI skills, provider-specific skill copies, OpenSpec, and historical operational documents. Root instructions already define most safety and authority rules, but four gaps remain:

1. `sgi-frontend-architecture` still illustrates horizontal roots that conflict with the enforced `app -> features -> shared` model.
2. `sgi-frontend-design` declares DM Sans as the only family and aliases both font tokens to it, while current conventions reserve DM Serif Display for approved display headings.
3. Git guidance currently sends every PR directly to `main`, while the requested target model uses `development` for shared integration and keeps `main` stable; remote Ruleset activation is not verified.
4. Cross-tool skill copies and future Copilot instructions have no concise repository-level discovery rule.

The current worktree also contains an unrelated tracked Sidebar/layout modification and untracked skill installations. They are preservation constraints, not inputs to this change.

## Goals / Non-Goals

**Goals:**

- Add narrow, reviewable governance language instead of rewriting established instructions.
- Align local SGI architecture and design skills with current tracked conventions.
- Make phase authorization, worktree authorization, skill selection, validation evidence, and Git target policy unambiguous.
- Keep one shared authority chain and use thin tool-specific adapters.
- Leave a reversible documentation-only migration with explicit verification.

**Non-Goals:**

- Change application behavior, RBAC, capabilities, routes, APIs, persistence, dependencies, or UI implementation.
- Modify installed generic skills or delete duplicate provider directories.
- Reconcile `PROJECT-STATE.md`, reorganize historical documentation, activate remote Rulesets, create branches/worktrees, or perform Apply/Archive during proposal work.
- Define or implement Design System V1 components.

## Decisions

### 1. Preserve the current authority hierarchy and add missing operational rules at root

`AGENTS.md` remains the shared policy owner. `frontend/AGENTS.md` and `backend/AGENTS.md` remain directory refinements. `frontend/CONVENTIONS.md` remains frontend technical and visual source of truth. Local skills remain task-specific guidance below those authorities.

Proposed root wording:

> Resolve instructions in this order: explicit approved task scope; current backend/domain/capability contracts; root `AGENTS.md`; applicable directory `AGENTS.md`; tracked technical standards; local SGI skills; external or provider-specific skills. Current Git, code, tests, and configuration outrank stale operational snapshots. Report contradictions; never repair them silently.

Alternative rejected: consolidate all rules into one large `AGENTS.md`. This would erase useful directory scoping and increase duplication pressure.

### 2. Make every OpenSpec phase an explicit authorization boundary

Proposed root wording:

> `EXPLORE`, `PROPOSE`, `APPLY`, `VERIFY`, and `ARCHIVE` are separate authorizations. Completing one phase does not authorize the next. `ARCHIVE` requires completed implementation, required verification evidence, and an explicit archive request; it never follows automatically from APPLY or VERIFY.

Alternative rejected: allow agents to infer phase transitions from task completion. This conflicts with existing scope control and can archive unverified changes.

### 3. Require authorization for worktrees and Git state transitions

Proposed root wording:

> Do not create a worktree, change branches, stash, reset, clean, rebase, merge, commit, push, or archive unless the user explicitly authorizes that operation or the active workflow contract names it. Inspect and preserve unrelated tracked and untracked work before any approved mutation.

Alternative rejected: automatically create isolated worktrees whenever the tree is dirty. Isolation is useful but still creates repository state and must remain user-controlled.

### 4. Select skills by responsibility, not by installed copy count

Discovery strategy:

```text
Task scope
   ↓
Applicable root/directory rules
   ↓
One primary local SGI skill
   ↓
Only necessary specialist skills
   ↓
Validation guardrail skill, when relevant
```

Proposed root wording:

> Discover skills from the active harness and repository-local skill directories. Select the minimum set whose descriptions match the task. Local SGI skills constrain generic skills. Equivalent copies installed for Claude, Continue, Junie, Kiro, CodeBuddy, OpenCode, or other providers are mirrors, not separate cumulative authorities; use one accessible copy unless contents materially differ, then report the drift.

Specialty mapping:

| Task | Primary SGI authority | Optional specialists |
|---|---|---|
| General implementation or refactor | `sgi-development-foundation` | Stack-specific skill |
| Frontend structure | `sgi-frontend-architecture` | React/TypeScript/Vite only as needed |
| Visual UI | `sgi-frontend-design` | `design-taste-frontend`, `ui-ux-pro-max`, `baseline-ui` |
| Forms | `sgi-forms-validation` | Zod/form library skill |
| Dashboard/navigation | `sgi-dashboard-ux` | UI specialist |
| Responsive/a11y | `sgi-responsive-accessibility` | Accessibility reviewer |
| Prisma/persistence | backend contract plus relevant Prisma skill | Database specialist only when authorized |

Alternative rejected: load every installed skill at task start. It increases contradictory guidance and context cost without improving correctness.

### 5. Align only the two contradictory SGI skills

`sgi-frontend-architecture` will replace its horizontal folder illustration with current `app/features/shared` boundaries, public APIs, legacy zones, TanStack Query ownership, and capability-aware navigation. `sgi-frontend-design` will adopt the tracked typography contract: DM Sans for interface/body and DM Serif Display only for approved display headings through `--font-heading`.

Proposed typography wording:

> Use DM Sans for interface, body, controls, navigation, forms, tables, dialogs, and reports. Reserve DM Serif Display for approved display or expressive institutional headings through `--font-heading`. Do not introduce another family or component-local font declaration without an approved Design System decision.

`frontend/CONVENTIONS.md` already contains the desired architecture and typography; it changes only if cross-references or a Design System V1 deferral note are needed. `frontend/AGENTS.md` changes only if a concise skill-selection pointer is needed. No demonstrated backend contradiction exists, so `backend/AGENTS.md` remains unchanged unless final comparison finds one.

Alternative rejected: modify generic installed skills. They are external mirrors, currently untracked in frontend, and not SGI-specific authorities.

### 6. Use risk-proportional validation

Proposed root wording:

> Choose validation from affected behavior and risk. Documentation-only governance changes require reference, contradiction, format, OpenSpec, and Git-scope checks. Runtime changes require focused tests plus affected project gates. Database, deployment, migration, or destructive checks require explicit authorization and a safe identified environment. Report each applicable check as `PASSED`, `FAILED`, `NOT_EXECUTED`, or `NOT_APPLICABLE` with evidence.

Alternative rejected: mandate full frontend and backend suites for every documentation change. This adds cost without testing the changed behavior and can generate artifacts.

### 7. Adopt a two-stage branch policy without claiming remote enforcement

`CONTRIBUTING.md`, root `AGENTS.md`, and the PR template must agree:

```text
topic branch ──PR──▶ development ──promotion PR──▶ main
                       integration                  stable
```

Proposed wording:

> Shared feature, fix, documentation, test, and configuration work enters through a dedicated branch and Pull Request to `development`. Promotion from `development` to stable `main` uses a reviewed Pull Request after required verification. This is repository policy; active branch protections and Rulesets must be verified separately and must not be reported as enabled without evidence.

Alternative rejected: update only `AGENTS.md`. Leaving `CONTRIBUTING.md` and the PR template on direct-to-main policy would preserve a live contradiction.

### 8. Add a thin Copilot adapter, not another policy copy

If GitHub Copilot repository instructions are adopted during APPLY, `.github/copilot-instructions.md` will contain only:

- pointer to root and directory-local `AGENTS.md` files;
- precedence statement;
- instruction to consult `frontend/CONVENTIONS.md` and backend layer rules by scope;
- instruction to preserve OpenSpec phase boundaries and current Git state;
- prohibition on treating the adapter as an independent source of product requirements.

Alternative rejected: duplicate all SGI rules in Copilot syntax. Duplicate policy will drift and make conflict resolution harder.

### 9. Keep Design System V1 as an explicit future contract

The aligned instructions will list these future decisions without defining component APIs or claiming implementation: buttons; forms; inputs; tables; iconography; DatePicker; DateRangePicker; CalendarView; toasts; dialogs; notifications; localization; accessibility component details.

Alternative rejected: encode component standards inside agent governance before a Design System change establishes requirements and evidence.

## Risks / Trade-offs

- **[Risk] Branch policy changes while remote configuration may differ** → State policy separately from verified Ruleset status and require repository evidence before claiming enforcement.
- **[Risk] Root instructions become too large** → Add concise rules and keep implementation detail in tracked standards and local skills.
- **[Risk] Tool-specific adapters drift** → Make adapters pointers only and review them whenever authority paths change.
- **[Risk] Skill duplicates contain different versions** → Treat duplicates as mirrors only when equivalent; report hash/content drift rather than merging instructions automatically.
- **[Risk] Documentation-only validation misses runtime regressions** → This change intentionally alters no runtime behavior; require stronger gates only if APPLY expands scope.
- **[Risk] Existing unrelated work is accidentally included** → Scope final diff to this change's documented files and explicitly exclude Sidebar and untracked installed skills.

## Migration Plan

1. Reconfirm branch, HEAD, dirty worktree, and excluded unrelated files without changing them.
2. Update root governance with narrow phase, worktree, skill, validation, and branch-policy rules.
3. Align `CONTRIBUTING.md` and PR template with `development -> main` promotion while marking Ruleset status unverified.
4. Align the two contradictory SGI skills; compare frontend/backend local instructions and avoid edits where no contradiction exists.
5. Add the thin Copilot adapter only within approved APPLY scope.
6. Record Design System V1 deferrals without defining component behavior.
7. Validate references, contradictions, OpenSpec artifacts, formatting, and final Git scope; do not run unrelated application suites.
8. Stop after VERIFY. Archive only through a separately authorized OpenSpec archive workflow.

Rollback is documentation-only: revert the coherent governance commit through normal review. Do not restore historical wording by resetting unrelated work, and do not remove provider skill directories as rollback.
