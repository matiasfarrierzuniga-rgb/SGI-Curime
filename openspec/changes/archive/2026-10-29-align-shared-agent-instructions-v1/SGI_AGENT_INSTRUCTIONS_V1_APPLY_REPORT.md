# SGI_AGENT_INSTRUCTIONS_V1_APPLY_REPORT

## Status

- **Phase:** APPLY complete; stopped for human review.
- **Change:** `align-shared-agent-instructions-v1`.
- **IMPLEMENTED:** 19/19 OpenSpec documentation tasks.
- **NOT EXECUTED:** application test, build, lint, and runtime validation suites; `NOT_APPLICABLE` because this increment changes documentation only and no runtime files, dependencies, APIs, database artifacts, or generated output.
- **ARCHIVE:** not executed and not authorized.
- **Git operations:** no branch change, worktree, commit, push, merge, stash, reset, clean, rebase, or Archive.

## Completed tasks

| Group | Completed work |
|---|---|
| 1. Baseline | Confirmed repository root, branch `feat/erp-shell-refinement-v1`, HEAD `8624d1f`, pre-existing Sidebar/layout modification, untracked provider skill copies, lockfiles, and change status. |
| 2. Governance | Aligned precedence, selective skills, phase boundaries, worktree/Git authorization, proportional validation, and Design System V1 deferrals. |
| 3. Git policy | Defined topic PR → `development` integration and reviewed `development` → `main` promotion; separated policy from unverified remote Rulesets. |
| 4. SGI skills | Replaced obsolete horizontal frontend target and aligned approved typography. Other SGI skills and provider copies remain unchanged. |
| 5. Cross-tool/frontend | Added a thin Copilot adapter and documented pending Design System/calendar decisions without claiming implementation. |
| 6. Validation | Searched contradictions, ran OpenSpec strict validation/status, checked whitespace, and reviewed final Git scope. |

## Documentation modified or added

- `AGENTS.md`
- `CONTRIBUTING.md`
- `.github/pull_request_template.md`
- `.github/copilot-instructions.md` — new thin adapter
- `frontend/AGENTS.md`
- `frontend/CONVENTIONS.md`
- `.agents/skills/sgi-frontend-architecture/SKILL.md`
- `.agents/skills/sgi-frontend-design/SKILL.md`
- `openspec/changes/align-shared-agent-instructions-v1/tasks.md`
- `openspec/changes/align-shared-agent-instructions-v1/SGI_AGENT_INSTRUCTIONS_V1_APPLY_REPORT.md`

## Contradictions resolved

1. **Frontend architecture:** `sgi-frontend-architecture` now follows `app -> features -> shared`, public feature APIs, legacy `NO_NEW_CODE` zones, TanStack Query ownership, and server-authoritative access boundaries.
2. **Typography:** `sgi-frontend-design` now matches `frontend/CONVENTIONS.md`: DM Sans for interface/body; DM Serif Display only for approved display headings through `--font-heading`.
3. **Git integration:** root instructions, contribution guide, and PR template now express `development` as integration and `main` as stable promotion target.
4. **Agent lifecycle:** each OpenSpec phase, including Archive, has an explicit authorization boundary.
5. **Skill copies:** local SGI skills constrain generic skills; provider copies are mirrors, not cumulative requirements.

## New rules

- Current Git, code, tests, and configuration outrank stale operational snapshots.
- Worktrees, branch changes, clean/reset/stash/rebase/merge, commit, push, and Archive require explicit authorization or an active contract naming the operation.
- Validation is proportional to risk and reported only as `PASSED`, `FAILED`, `NOT_EXECUTED`, or `NOT_APPLICABLE` with evidence.
- Copilot instructions reference repository authorities instead of duplicating policy.
- Future Design System V1 decisions include buttons, forms, inputs, tables, iconography, date controls, notifications, localization, and component accessibility.
- Provisional date-control policy forbids introducing shared calendar APIs, date formats, or dependencies through unrelated work; existing approved patterns and accessibility baseline apply until Design System V1.

## Validation

| Check | Result | Evidence |
|---|---|---|
| Contradiction search | PASSED | No active direct-to-`main` integration, automatic-worktree, automatic-phase, horizontal-target, or single-font match in final governance files. |
| `openspec validate align-shared-agent-instructions-v1 --strict --type change` | PASSED | `Change 'align-shared-agent-instructions-v1' is valid`. |
| `openspec status --change align-shared-agent-instructions-v1` | PASSED | 4/4 planning artifacts complete. |
| `git diff --check` | PASSED | Exit code 0; only line-ending warnings. |
| Final Git scope review | PASSED | Approved governance/OpenSpec files added or modified; existing `frontend/src/app/layouts/ErpLayout.tsx`, provider skill directories, and lockfiles preserved. |
| Frontend/backend test suites | NOT_APPLICABLE | Documentation-only scope; no runtime behavior changed. |

## Risks and pending items

- Remote `development` and `main` branch protections/Rulesets remain **NOT_VERIFIED**. Policy language does not claim they are active.
- `PROJECT-STATE.md` remains untouched despite its known divergence from current Git; it requires dedicated reconciliation.
- Generic/provider skill copies remain untracked and unchanged; material drift should be assessed only when relevant to a future task.
- Design System V1 remains proposed. Buttons, forms, inputs, tables, icons, date controls, toasts, dialogs, notifications, localization, and component accessibility need a dedicated specification before implementation.
- Human review is required before any commit, push, Pull Request, VERIFY expansion, or Archive request.
