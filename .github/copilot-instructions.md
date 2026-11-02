# GitHub Copilot instructions for SGI-Curime

Use repository authority in this order: explicit approved task scope, current backend/domain/capability contracts, root `AGENTS.md`, applicable directory `AGENTS.md`, and current tracked standards. This file is an adapter, not an independent product, architecture, Git, validation, or RBAC policy.

- Read root `AGENTS.md` before work. For frontend, also read `frontend/AGENTS.md` and `frontend/CONVENTIONS.md`; for backend, read `backend/AGENTS.md` and `docs/architecture/backend-layer-rules.md`.
- Preserve OpenSpec phase boundaries: EXPLORE, PROPOSE, APPLY, VERIFY, and ARCHIVE need separate authorization. Do not implement, archive, create a worktree, change branches, clean files, commit, push, or merge without applicable explicit authorization.
- Inspect and preserve current Git state, including unrelated tracked and untracked files. Current Git, code, tests, and configuration outrank stale operational snapshots.
- Do not invent endpoints, routes, fields, domain states, capabilities, RBAC behavior, or Design System components. Consult the relevant authoritative contract and report conflicts instead of silently resolving them.
