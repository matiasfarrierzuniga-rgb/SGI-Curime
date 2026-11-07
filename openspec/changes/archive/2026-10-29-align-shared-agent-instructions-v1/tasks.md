# Tasks

## 1. Preserve baseline and scope

- [x] 1.1 Reconfirm branch, HEAD, tracked modifications, untracked directories, and OpenSpec change status; record exclusions for `frontend/src/app/layouts/ErpLayout.tsx`, installed skill copies, lockfiles, and `PROJECT-STATE.md`, verified with `git status --short --branch` and `openspec status --change align-shared-agent-instructions-v1`.
- [x] 1.2 Compare root, frontend, and backend `AGENTS.md`, `frontend/CONVENTIONS.md`, `CONTRIBUTING.md`, PR template, and affected SGI skills against the approved spec; verify every planned edit maps to a named requirement and no backend/API/RBAC behavior is selected for change.

## 2. Align shared governance

- [x] 2.1 Update root `AGENTS.md` with concise instruction precedence, current-evidence handling, selective skill discovery, provider-copy treatment, and Design System V1 deferrals; verify all named authorities and deferred component families are present exactly once.
- [x] 2.2 Strengthen root `AGENTS.md` phase rules so EXPLORE, PROPOSE, APPLY, VERIFY, and ARCHIVE require separate authorization; verify Archive requires completed implementation, required evidence, and an explicit archive request.
- [x] 2.3 Add explicit worktree and Git-operation authorization plus proportional validation statuses to root `AGENTS.md`; verify unrelated work preservation and `PASSED | FAILED | NOT_EXECUTED | NOT_APPLICABLE` semantics are unambiguous.
- [x] 2.4 Review `frontend/AGENTS.md` and `backend/AGENTS.md` after root alignment, making only necessary narrow cross-reference edits; verify backend contracts, RBAC, API, database, and registration rules remain semantically unchanged.

## 3. Align Git contribution policy

- [x] 3.1 Update `CONTRIBUTING.md` from direct topic-to-`main` integration to topic PRs into `development` and reviewed promotion PRs into stable `main`; verify branch lifecycle examples, start points, push guidance, merge guidance, and emergency language no longer contradict the two-stage policy.
- [x] 3.2 Update `.github/pull_request_template.md` to identify target branch, distinguish integration from promotion PRs, and avoid asserting active Rulesets; verify existing scope, QA, risk, and review gates remain intact.
- [x] 3.3 Align root `AGENTS.md` Git wording with `CONTRIBUTING.md`; verify repository policy and remotely verified protection status are stated as separate concepts.

## 4. Resolve local skill contradictions

- [x] 4.1 Replace the horizontal organization in `.agents/skills/sgi-frontend-architecture/SKILL.md` with `app -> features -> shared`, feature public APIs, legacy `NO_NEW_CODE` zones, TanStack Query ownership, and capability-aware navigation; verify it no longer recommends root `components/pages/services/types` as target architecture.
- [x] 4.2 Align `.agents/skills/sgi-frontend-design/SKILL.md` with tracked typography: DM Sans for interface/body and DM Serif Display only for approved display headings through semantic tokens; verify it no longer states that both font tokens alias one family.
- [x] 4.3 Compare remaining SGI skills against the aligned authorities and leave them unchanged unless a direct contradiction is evidenced; verify generic/provider-installed skill copies are neither modified nor deleted.

## 5. Add cross-tool and frontend-standard references

- [x] 5.1 Add `.github/copilot-instructions.md` as a thin adapter to root and directory-local authorities, current standards, OpenSpec phase boundaries, and Git preservation rules; verify it does not duplicate product, architecture, validation, or RBAC policy blocks.
- [x] 5.2 Add only necessary cross-references or Design System V1 deferral notes to `frontend/CONVENTIONS.md`; verify existing architecture, typography, accessibility, component, and validation contracts are unchanged.
- [x] 5.3 Ensure every future Design System V1 item—buttons, forms, inputs, tables, iconography, DatePicker, DateRangePicker, CalendarView, toasts, dialogs, notifications, localization, and accessibility details—is marked proposed or pending; verify none is described as implemented solely by this change.

## 6. Integrated documentation verification

- [x] 6.1 Search final governance files for conflicting direct-to-`main`, automatic worktree, automatic phase transition, horizontal frontend target, and single-font statements; verify no unresolved active contradiction remains and historical files were not reorganized.
- [x] 6.2 Run `openspec validate align-shared-agent-instructions-v1 --strict --type change` and `openspec status --change align-shared-agent-instructions-v1`; record exact outcomes and verify all planning artifacts remain complete.
- [x] 6.3 Run `git diff --check`, inspect `git diff --name-only` and `git status --short --branch`, and verify final scope contains only approved governance/OpenSpec files while preserving Sidebar changes, untracked skills, lockfiles, branch, and worktree.
- [x] 6.4 Record application test suites as `NOT_APPLICABLE` for this documentation-only increment unless scope expanded into runtime files; if scope expanded, stop and obtain revised approval before selecting proportional tests.

## Workflow follow-up

- After APPLY and VERIFY complete, request human review before any commit, push, or Pull Request operation.
- Archive this OpenSpec change only through a separately authorized archive workflow after required evidence is accepted.
