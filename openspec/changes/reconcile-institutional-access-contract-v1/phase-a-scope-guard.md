# Phase A Scope Guard And Final-Diff Checklist

Date: 2026-10-05  
Applies to: `reconcile-institutional-access-contract-v1`, Phase A only.

## Frozen Prohibitions

Do not introduce or modify:

- Prisma schema, migrations, generated persistence contract, or persistent authorization models.
- OTP/numeric-code activation, OAuth, OIDC, replacement authentication, or dynamic RBAC administration.
- Governance/BoardPosition/GovernancePosition/appointment-label/affiliate-legacy-role mapping to software Role or capability.
- New capability identifiers, capability-policy entries, static role mappings, controller-guard migrations, or registration behavior.
- Frontend source, `tasks.md`, production backend source, or backend tests for evidence-only Phase A work.

## Required Final-Diff Check

Before Phase A handoff, run and record:

```text
git diff --check
git status --short
git diff --name-only
```

Inspect staged and unstaged paths. Phase A is valid only when changed tracked paths are limited to this change's non-production evidence and scope-guard files, except separately authorized work owned by another agent.

## Prohibited-Category Search Checklist

Review final diff and confirm all statements:

- [ ] No path under `backend/prisma/` changed.
- [ ] No path matching Prisma migration or generated-client output changed.
- [ ] No `schema.prisma` change.
- [ ] No new persistent authorization model/table/relation.
- [ ] No OAuth/OIDC provider, callback, token exchange, or dependency added.
- [ ] No numeric OTP/code generation, verification, or delivery flow added.
- [ ] No Role, Permission, or RolePermission CRUD/mutation API added.
- [ ] No new capability identifier or `ROLE_CAPABILITIES` mapping added.
- [ ] No authorization derives from governance position, BoardPosition, appointment label, or affiliate legacy role snapshot.
- [ ] No legacy role guard migration or registration behavior change.
- [ ] No production code or test behavior changed for Phase A evidence work.
- [ ] `openspec/changes/reconcile-institutional-access-contract-v1/tasks.md` unchanged.

## Current Phase A Record

- [x] Backend evidence file records current account/auth and capability baseline.
- [x] This scope guard records frozen prohibitions and final-diff review.
- [x] No production source, backend tests, Prisma, migrations, or `tasks.md` changed by Forge in this Phase A evidence continuation.
- [x] Human/lead performs final combined multi-agent diff review before Phase A completion.
