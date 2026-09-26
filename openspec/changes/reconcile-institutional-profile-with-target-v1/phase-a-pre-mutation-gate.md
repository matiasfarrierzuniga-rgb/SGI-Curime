# Phase A — Pre-Mutation Gate

## Purpose

This checkpoint implements the read-only evidence required by OpenSpec task 1.4 and the code-level abort rules required by task 1.5. It does not authorize schema, migration, application, or data mutation.

The preflight tool is `backend/prisma/reconcile-organization-profile-preflight.mjs`.

It opens PostgreSQL with a `REPEATABLE READ READ ONLY` transaction, inspects metadata and singleton state, and rolls back before disconnecting.

## Safety contract

The tool MUST NOT print institutional field values. Output is limited to classification labels, migration/checksum status, table/singleton counts, mapped field names compared or conflicting, BoardTerm counts/FK target, and boolean process controls.

Exit codes: `0` = eligible for checkpoint review only; `2` = classified but blocked; `1` = operational failure.

A zero exit code is not mutation authorization. Task 1.6 must also be verified and the full Pre-Mutation Gate reviewed.

## Required process controls

Before a run intended to become gate evidence, declare `DIRECT_URL` or `DATABASE_URL`, `RECONCILIATION_ENVIRONMENT_ID`, `RECONCILIATION_ENVIRONMENT_OWNER`, and `RECONCILIATION_AUTHORITY_CONFIG_PATH`.

Task 1.4 does not parse or log authoritative values. Task 3.1 owns the eventual canonical configuration contract. Phase A only proves that an authoritative input source exists before mutation is considered.

## Classifications

| Classification | Meaning | Mutation posture |
| --- | --- | --- |
| `MAIN_LEGACY_ONLY` | Shared `InstitutionalProfile` exists and canonical table does not. | Normal in-place path candidate; still gated. |
| `CANONICAL_ONLY` | Canonical table exists and legacy table does not. | Recovery/re-attestation candidate; history must still be supported. |
| `BOTH_EQUIVALENT` | Both roots exist and every nonblank mapped legacy candidate agrees with canonical storage. | Manual reviewed cutover candidate; semantic attestation is still required. |
| `BOTH_CONFLICTING` | Both roots exist and one or more mapped fields disagree. | Abort; no automatic winner. |
| `NEITHER` | Neither institutional root exists. | Abort. |
| `HISTORY_MISMATCH` | Protected migration history or required physical shape is unsupported. | Abort before mutation. |

`BOTH_EQUIVALENT` means storage comparison only. It does not prove legal or semantic equivalence for region, address, or organization type.

## Abort behavior implemented for task 1.5

The gate blocks on: `UNSUPPORTED_MIGRATION_OR_PHYSICAL_STATE`, `MULTIPLE_SINGLETON_ROWS`, `INVALID_SINGLETON_IDENTITY`, `CONFLICTING_ROOTS`, `NO_INSTITUTIONAL_ROOT`, `UNKNOWN_ENVIRONMENT_OWNERSHIP`, `AUTHORITATIVE_CONFIGURATION_UNAVAILABLE`, `BOARD_FOREIGN_KEY_UNSUPPORTED`, and `BOARD_TERM_NON_SINGLETON_REFERENCE`.

No blocker selects, merges, overwrites, deletes, or repairs institutional data.

## Verification commands

From `backend/`:

    node --test prisma/reconcile-organization-profile-preflight.spec.mjs
    node prisma/reconcile-organization-profile-preflight.mjs

The user executes validation. Until real command output is supplied, test status is `NOT_EXECUTED`.

## Task status

- 1.4 implementation: authored in this change.
- 1.5 definition: authored; exercise remains pending until the focused test command is actually run and its output reviewed.
- 1.6: procedure is documented separately in `checkpoint-restore-procedure.md`; completion remains pending until a real dump/restore verification is performed.

No 2.x work is authorized by this document.
