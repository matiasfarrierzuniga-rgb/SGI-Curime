# Proposal

## Why

SGI-Curime has authoritative repository instructions, local skills, provider-specific skill copies, and historical operational documents that partially overlap and sometimes contradict one another. A reviewed governance contract is needed so every supported agent applies the same precedence, planning lifecycle, Git safety, validation, architecture, and visual-system boundaries without duplicating rules across tools.

## What Changes

- Align shared agent governance while preserving the current root, frontend, and backend `AGENTS.md` files as the starting authorities.
- Resolve the documented frontend architecture contradiction by making `app -> features -> shared` and `frontend/CONVENTIONS.md` authoritative over the horizontal layout still described by `sgi-frontend-architecture`.
- Resolve the typography contradiction by preserving DM Sans for interface text and DM Serif Display only for approved display headings, using existing semantic tokens.
- Define selective skill discovery and activation by task specialty, with local SGI skills taking precedence over generic or provider-specific copies.
- Formalize the complete `EXPLORE -> PROPOSE -> APPLY -> VERIFY -> ARCHIVE` lifecycle, including explicit authorization boundaries between phases.
- Require explicit authorization before creating worktrees, changing branches, or performing integration operations.
- Define validation proportional to change risk and require truthful `NOT_EXECUTED`, `PASSED`, `FAILED`, or `NOT_APPLICABLE` reporting.
- Preserve backend contracts, capability-based authorization, and RBAC boundaries; this change introduces no API, persistence, route, or permission behavior.
- Define a minimal Git policy statement: shared work uses Pull Requests toward `development`, promotion to stable `main` remains review-controlled, and no active Ruleset is claimed without repository evidence.
- Establish a non-duplicating Copilot strategy: a future thin adapter points to repository authorities instead of restating them.
- Record buttons, forms, inputs, tables, iconography, calendar controls, toasts, dialogs, notifications, localization, and accessibility as future Design System V1 decisions, not implemented behavior.

## Capabilities

### New Capabilities
- `architecture/agent-instruction-governance`: Defines precedence, lifecycle, skill selection, Git safety, proportional validation, cross-tool instruction adapters, and preservation boundaries for SGI-Curime agents.

### Modified Capabilities

None.

## Impact

- Candidate documentation: `AGENTS.md`, `CONTRIBUTING.md`, `.github/pull_request_template.md`, `frontend/AGENTS.md`, `frontend/CONVENTIONS.md`, and only if demonstrated necessary, `backend/AGENTS.md`.
- Candidate local skills: `.agents/skills/sgi-frontend-architecture/SKILL.md`, `.agents/skills/sgi-frontend-design/SKILL.md`, and other SGI skills only where alignment requires a narrow clarification.
- Candidate cross-tool instruction surface: a future `.github/copilot-instructions.md` adapter, subject to confirmation of GitHub Copilot conventions and without copying the full governance text.
- OpenSpec artifacts under this change, including the requested proposal report.
- No application code, APIs, Prisma schema, migrations, dependencies, installed skill copies, Sidebar files, historical documentation organization, branch, worktree, commit, push, merge, Apply, or Archive changes are included in this planning phase.
