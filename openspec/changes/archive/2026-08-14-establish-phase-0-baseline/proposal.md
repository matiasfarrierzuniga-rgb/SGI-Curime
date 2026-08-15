## Why

SGI-Curime lacks an evidence-based architectural baseline, so later modernization work cannot be planned safely or measured against the repository's actual state. Establishing the baseline now prevents unsupported assumptions, protects the functional backend from unnecessary rewrites, and identifies decisions that require approval before Phase 1.

## What Changes

- Audit the tracked repository, relevant untracked project configuration, Git state, package metadata, frontend, backend, Prisma/PostgreSQL persistence, authentication, infrastructure, tests, builds, and documentation.
- Create `docs/architecture/current-state.md` describing only verified architecture and behavior, with unknown or unverified details identified explicitly.
- Create `docs/architecture/gap-analysis.md` comparing the verified state with the target architecture and recording gaps, risks, technical debt, existing capabilities, missing capabilities, implemented decisions, and decisions still requiring formalization.
- Run the existing non-destructive validation commands that the available environment supports and report commands, outcomes, and blockers without correcting discovered defects.
- Verify the Phase 0 Definition of Done and stop before architectural decisions or implementation work from later phases.
- Exclude application code changes, dependency installation, migrations, infrastructure changes, authentication changes, ADR creation, and Phase 1 work.

## Capabilities

### New Capabilities

- `architecture/baseline-documentation`: Defines the evidence, content, validation reporting, and completion criteria for the repository's architectural baseline and target-state gap analysis.

### Modified Capabilities

None.

## Impact

- Adds two architecture documents under `docs/architecture/` during implementation.
- Reads repository source, configuration, Git metadata, and available validation tooling without changing runtime behavior.
- Does not change APIs, database schemas, migrations, dependencies, authentication, deployment topology, or application code.
- Produces the approved input required before Phase 1 ADR work can begin.
