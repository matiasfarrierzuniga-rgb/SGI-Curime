## Context

See `proposal.md` for motivation and `specs/architecture/baseline-documentation/spec.md` for the documentation contract. The repository contains two independent npm projects, a functional modular NestJS backend, a Vite starter frontend, Prisma/PostgreSQL persistence, and PostgreSQL-only Compose configuration. Existing documentation is insufficient to distinguish implemented behavior from planned behavior, local dependencies are not currently recognized as installed, and Docker is unavailable in the inspected environment.

The audit must preserve the worktree and runtime state. Existing untracked OpenSpec and agent configuration is relevant context but must not be conflated with tracked application architecture. The execution plan supplied with the change is the target-state source; repository files and command results are the current-state sources.

## Goals / Non-Goals

**Goals:**

- Produce a reproducible snapshot whose claims can be traced to files, Git metadata, package declarations, or command output.
- Keep current-state facts separate from target-state comparison and recommendations.
- Make validation failures and environmental blockers visible without turning the audit into a repair task.
- Provide enough evidence and prioritization for reviewers to approve or revise the transition to Phase 1.

**Non-Goals:**

- Prove production behavior that cannot be established from this checkout and environment.
- Install dependencies or bootstrap databases merely to make validations pass.
- Select implementation details for later frontend, authentication, OpenAPI, Docker, or CI phases.
- Record ADRs or treat target-state choices as already implemented.

## Decisions

### Use an explicit evidence hierarchy

Claims will prefer executable configuration and source code over README statements, and command output over assumptions about the local environment. Each major section will include concrete paths or commands. Where sources conflict, both will be recorded and the executable source will describe current behavior.

Alternative considered: summarize the repository from its README. Rejected because both application READMEs contain starter content and the root README describes planned capabilities that are not all implemented.

### Classify findings by verification state

Current-state findings will use clear language for `verified`, `configured but not executed`, `missing`, and `unknown`. The gap analysis will use `aligned`, `partial`, `missing`, and `unverified`. This prevents declared dependencies, ignored builds, mocked tests, or planned modules from being reported as operational behavior.

Alternative considered: a binary present/absent assessment. Rejected because configuration presence does not establish build, migration, deployment, or runtime success.

### Separate factual inventory from target comparison

`current-state.md` will be self-contained and descriptive. `gap-analysis.md` will reference that inventory while adding target alignment, risk, priority, and the applicable future phase. New choices not established by the execution plan will be labelled `PROPOSAL` or pending decision.

Alternative considered: one combined architecture report. Rejected because it would blur facts, desired state, and recommendations and make future updates harder to review.

### Apply a non-destructive validation policy

Commands that only inspect or validate will be attempted when prerequisites are available. Commands that mutate source by default, require secrets or a live database, generate artifacts as part of normal execution, or depend on unavailable tooling will be reported as not run or blocked unless they have a safe check-only form. Failed commands will remain evidence; Phase 0 will not repair their causes.

Alternative considered: install all dependencies and provision PostgreSQL to maximize validation coverage. Rejected because installation and environment provisioning exceed the documentation-only boundary and would alter the baseline being measured.

### Enforce a documentation-only change boundary

Before completion, the implementation diff will be inspected to confirm that only `docs/architecture/current-state.md` and `docs/architecture/gap-analysis.md`, plus their parent directories if new, were created. Phase 0 will conclude with the required report and explicit approval gate.

Alternative considered: correct small defects discovered during inspection. Rejected because mixed remediation would make the baseline inaccurate, reduce reversibility, and violate phase sequencing.

## Risks / Trade-offs

- [Unavailable dependencies prevent build and test execution] -> Record declared scripts and test coverage separately from execution status, including the exact prerequisite blocker.
- [Docker is unavailable] -> Inspect Compose statically and report runtime validation as blocked rather than assuming service health.
- [The working tree contains relevant untracked tooling] -> Identify it explicitly and avoid attributing it to the tracked product without Git evidence.
- [The ignored root `dist/` differs from tracked frontend source] -> Record provenance as unknown and do not use it as evidence of reproducible frontend capability.
- [Repository changes during the audit could stale findings] -> Capture branch, commit, and working-tree status and re-check them before finalizing the documents.
- [Detailed path references can age] -> Prefer stable file paths and architectural boundaries; include line references only where they materially improve traceability.

## Migration Plan

1. Capture the Git snapshot and inventory repository structure, tools, packages, and configuration.
2. Inspect each required technical area and collect evidence without editing product files.
3. Attempt safe validations and preserve their exact outcomes or blockers.
4. Write and cross-check `current-state.md` against the collected evidence.
5. Derive `gap-analysis.md` from the approved target architecture and the completed current-state document.
6. Re-check Git status, document the Phase 0 Definition of Done, and stop for approval.

Rollback consists of removing the two newly added documentation files; no runtime or data migration is involved.
