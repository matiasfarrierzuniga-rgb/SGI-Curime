# Database Checkpoint And Restore Procedure

## Scope

This procedure is the required OpenSpec 1.6 checkpoint before any institutional reconciliation mutation.

A checkpoint is verified only after: a custom-format PostgreSQL dump succeeds; its checksum is recorded outside tracked source; `pg_restore --list` succeeds; the dump restores into an isolated empty database; the organization-profile preflight runs against source and restore; sanitized evidence agrees; and the restore database is confirmed disposable.

Operational evidence belongs in the git-ignored `.opencode/reports/<YYYY-MM-DD>/` area or another approved secure location. Do not commit database dumps, credentials, institutional values, or authoritative configuration.

## Preconditions

- PostgreSQL client tools are installed and compatible with the server.
- The environment owner explicitly identifies the source database.
- An isolated restore database can be provisioned without receiving normal application traffic.
- The authoritative configuration artifact required by Phase A is available.
- No schema/data reconciliation command has been run yet.

## 1. Create a secure evidence directory

Example PowerShell:

    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $day = Get-Date -Format "yyyy-MM-dd"
    $checkpointDir = ".opencode/reports/$day/organization-profile-checkpoint-$stamp"
    New-Item -ItemType Directory -Force -Path $checkpointDir | Out-Null

## 2. Capture the source preflight

From `backend/`, with the source connection and control variables loaded:

    node prisma/reconcile-organization-profile-preflight.mjs *> "../$checkpointDir/source-preflight.json"
    $sourcePreflightExit = $LASTEXITCODE

Exit `2` may still be useful diagnostic evidence but does not authorize mutation. Exit `1` invalidates the run.

## 3. Create the PostgreSQL checkpoint

    $dumpFile = "../$checkpointDir/database.dump"
    pg_dump --dbname="$env:DIRECT_URL" --format=custom --no-owner --no-privileges --file="$dumpFile"
    if ($LASTEXITCODE -ne 0) { throw "pg_dump failed" }
    Get-FileHash -Algorithm SHA256 $dumpFile | Format-List | Out-File "../$checkpointDir/database.dump.sha256.txt"
    pg_restore --list "$dumpFile" | Out-File "../$checkpointDir/database.dump.list.txt"
    if ($LASTEXITCODE -ne 0) { throw "pg_restore --list failed" }

## 4. Provision an isolated empty restore database

Expose its direct connection string as `RESTORE_DIRECT_URL`. It must not receive normal SGI traffic, must not reuse the source database, and must be safe to destroy after evidence review.

## 5. Restore in one transaction

    pg_restore --dbname="$env:RESTORE_DIRECT_URL" --exit-on-error --single-transaction --no-owner --no-privileges "$dumpFile"
    if ($LASTEXITCODE -ne 0) { throw "checkpoint restore failed" }

Do not use `--clean` against a nonempty/shared database. This procedure requires a newly provisioned isolated target.

## 6. Run the same sanitized preflight on the restore

Temporarily point `DIRECT_URL` to `RESTORE_DIRECT_URL`, use a restore-specific `RECONCILIATION_ENVIRONMENT_ID`, run the same preflight, write the JSON to `restore-preflight.json`, then restore the original environment variables.

Exit `1` invalidates restore verification.

## 7. Compare only sanitized evidence

Source and restore must agree on: protected migration records/checksum-match booleans; classification/topology; legacy/canonical table presence; row counts and `id = 1` counts; root-comparison field-name sets; BoardTerm row count; BoardTerm non-singleton reference count; and Board FK target.

Do not copy institutional values into the report.

Record locally:

    CHECKPOINT_CREATED=YES|NO
    DUMP_SHA256_RECORDED=YES|NO
    RESTORE_COMPLETED=YES|NO
    SOURCE_PREFLIGHT_EXIT=<0|2>
    RESTORE_PREFLIGHT_EXIT=<0|2>
    SANITIZED_EVIDENCE_MATCH=YES|NO
    CHECKPOINT_RESTORE_VERIFIED=YES|NO

`CHECKPOINT_RESTORE_VERIFIED=YES` is permitted only when all required steps pass.

## 8. Failure / abort rules

- `pg_dump` failure -> stop.
- dump-list failure -> stop.
- restore failure -> stop.
- preflight operational failure -> stop.
- sanitized evidence mismatch -> stop and investigate; do not repair automatically.
- source state `HISTORY_MISMATCH`, `BOTH_CONFLICTING`, or `NEITHER` -> checkpoint may be retained as recovery evidence, but mutation remains blocked.
- multiple singleton rows, unknown ownership, unavailable authoritative configuration, unsupported Board FK, or non-singleton BoardTerm references -> mutation remains blocked.

## 9. Restore use during an incident

Before canonical writes begin, normal rollback is application rollback plus abort with no DB mutation. During or after approved reconciliation mutation, restoration from this checkpoint is an incident operation requiring explicit owner review.

Never edit `_prisma_migrations` manually to simulate rollback. After canonical writes begin, prefer reviewed forward-fix unless the incident owner explicitly chooses full checkpoint restoration. Never reactivate an independent legacy writer.

## Verification state

This procedure is documented but not yet verified until a real source dump is restored into an isolated database and the sanitized evidence comparison is reviewed. Therefore OpenSpec task 1.6 must remain unchecked until that evidence exists.
