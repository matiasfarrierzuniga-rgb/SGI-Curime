# SGI_AGENT_INSTRUCTIONS_V1_ARCHIVE_REPORT

## Status

- **Change:** `align-shared-agent-instructions-v1`.
- **VERIFY:** `PASSED`.
- **ARCHIVE:** `PASSED`.
- **Archived location:** `openspec/changes/archive/2026-10-29-align-shared-agent-instructions-v1/`.
- **Branch / HEAD:** `feat/erp-shell-refinement-v1` / `8624d1f5af8c5702b7f397e3c7f0bded4333ba0c`.
- **Git operations excluded:** no branch change, worktree, commit, push, merge, or Pull Request.

## Verify evidence

| Check | Result | Evidence |
|---|---|---|
| Expected branch and HEAD | PASSED | Branch `feat/erp-shell-refinement-v1`; HEAD `8624d1f5af8c5702b7f397e3c7f0bded4333ba0c`. |
| Completed tasks | PASSED | `tasks.md` has 19/19 checked tasks. |
| Governance consistency | PASSED | Reviewed root and frontend instructions, contribution guide, Copilot adapter, and two modified SGI skills; contradiction search found no active direct-to-`main` integration, automatic worktree/phase, horizontal frontend target, or single-font statement. |
| Documentation references | PASSED | Referenced `AGENTS.md`, frontend/backend instructions, `frontend/CONVENTIONS.md`, contribution guide, PR template, Copilot adapter, and skills exist. |
| Scope integrity | PASSED | No React, CSS, backend, Prisma, RBAC, API, or functional-contract file changed by this increment. `frontend/src/app/layouts/ErpLayout.tsx`, untracked provider skills, and locks remain excluded. |
| Change validation | PASSED | `openspec.cmd validate "align-shared-agent-instructions-v1" --strict --type change`: valid. |
| Formatting | PASSED | `git diff --check`: exit code 0; line-ending warnings only. |
| Application suites | NOT_APPLICABLE | Documentation-only increment; not executed by authorization and scope. |

## Canonical specification synchronization

- **IMPLEMENTED:** `openspec/specs/architecture/agent-instruction-governance/spec.md`.
- **Validation:** `openspec.cmd validate --specs` passed: 4 specs, 0 failures.
- **Content:** 10 canonical requirements copied from approved delta, including precedence, phase authorization, repository safety, selective skills, architecture/typography alignment, truthful validation, contract preservation, Git policy, thin adapters, and Design System V1 deferral.

## Archive evidence

Official command:

```text
openspec.cmd archive "align-shared-agent-instructions-v1" --skip-specs --yes --json
```

Result:

```text
archivedAs: 2026-10-29-align-shared-agent-instructions-v1
specsUpdated: false
```

`--skip-specs` was used because the canonical spec was synchronized and validated before archive, preventing duplicate application of its `ADDED` delta. `openspec.cmd list --json` no longer includes `align-shared-agent-instructions-v1` among active changes.

## Documentation-only publication inventory

Include exactly these paths in a dedicated documentation PR:

```text
.agents/skills/sgi-frontend-architecture/SKILL.md
.agents/skills/sgi-frontend-design/SKILL.md
.github/copilot-instructions.md
.github/pull_request_template.md
AGENTS.md
CONTRIBUTING.md
frontend/AGENTS.md
frontend/CONVENTIONS.md
openspec/specs/architecture/agent-instruction-governance/spec.md
openspec/changes/archive/2026-10-29-align-shared-agent-instructions-v1/.openspec.yaml
openspec/changes/archive/2026-10-29-align-shared-agent-instructions-v1/design.md
openspec/changes/archive/2026-10-29-align-shared-agent-instructions-v1/proposal.md
openspec/changes/archive/2026-10-29-align-shared-agent-instructions-v1/SGI_AGENT_INSTRUCTIONS_V1_APPLY_REPORT.md
openspec/changes/archive/2026-10-29-align-shared-agent-instructions-v1/SGI_AGENT_INSTRUCTIONS_V1_ARCHIVE_REPORT.md
openspec/changes/archive/2026-10-29-align-shared-agent-instructions-v1/SGI_AGENT_INSTRUCTIONS_V1_PROPOSAL_REPORT.md
openspec/changes/archive/2026-10-29-align-shared-agent-instructions-v1/tasks.md
openspec/changes/archive/2026-10-29-align-shared-agent-instructions-v1/specs/architecture/agent-instruction-governance/spec.md
```

Explicitly exclude:

```text
frontend/src/app/layouts/ErpLayout.tsx
frontend/.agents/
frontend/.claude/
frontend/.codebuddy/
frontend/.continue/
frontend/.junie/
frontend/.kiro/
frontend/pnpm-lock.yaml
frontend/skills-lock.json
```

## Git state and integration risks

- Current tree is intentionally dirty. The listed documentation files coexist with excluded ERP Shell/Sidebar work in `frontend/src/app/layouts/ErpLayout.tsx` and untracked provider artifacts.
- Repository policy documented by this increment uses topic PRs into `development`, then a separate reviewed promotion PR from `development` to stable `main`.
- User-requested direct destination `main` for the future documentation PR is higher-priority scope but diverges from that documented policy. Before publication, decide and record an explicit exception or route the PR through `development`; do not silently treat policy as satisfied.
- Remote branch protections and Rulesets for `development` or `main` remain `NOT_VERIFIED`.
- A documentation-only PR must be assembled from an isolated, clean staging selection or equivalent review process; current branch contains excluded work. No worktree or branch was created here because authorization forbade it.
