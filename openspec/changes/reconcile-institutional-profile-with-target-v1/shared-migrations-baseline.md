# Baseline Inmutable de Migraciones Compartidas

## Alcance

Este checkpoint protege exclusivamente estas rutas compartidas:

- `backend/prisma/migrations/20260920120000_add_institutional_profile/migration.sql`
- `backend/prisma/migrations/20260922120000_add_institutional_board/migration.sql`

No autoriza cambios de Prisma, base de datos, migraciones, datos, Target v1 ni evidencia DB-1. El baseline se identifica por commits fijos; no se consulta ni actualiza ningún remoto.

## Commits congelados

| Evidencia | Commit fijo | Ruta o alcance |
| --- | --- | --- |
| Freeze canónico Target v1 | `dc86d810549216eec90fc561705d6b0063179f70` | `docs/data/`; referencia inmutable. Sus documentos Target no pertenecen al worktree actual y no se alteran. |
| Estado documental | `642dbe164265de93c3c44f43f2911522b5faee6f` | `docs/data/` y OpenSpec de reconciliación documental. |
| DB-1 histórica | `9173bee4e54192f78cf1210fbf8c770c4519007d` | Evidencia histórica de implementación `OrganizationProfile`; no se incorpora ni modifica. |
| DB-1 archivada | `23fd62bf5b3146de7cd7e759d78dffc6e36c5b77` | Evidencia archivada DB-1; permanece cerrada e inmutable. |
| Baseline `origin/main` | `dc2a2d84a91e2484b9959812ba80cd7f8db151ac` | Árbol fuente de las dos migraciones protegidas. |

## Blobs protegidos

| Ruta | Blob en baseline `origin/main` | Blob requerido en worktree |
| --- | --- | --- |
| `backend/prisma/migrations/20260920120000_add_institutional_profile/migration.sql` | `23e6410d2073209a71bca470e8d15e4d2f3aa72c` | `23e6410d2073209a71bca470e8d15e4d2f3aa72c` |
| `backend/prisma/migrations/20260922120000_add_institutional_board/migration.sql` | `b7c78f1cf9d9f5117081b566ede3c0449acda499` | `b7c78f1cf9d9f5117081b566ede3c0449acda499` |

## Reproducción verificable

Desde raíz del repositorio, ejecutar:

```powershell
node openspec/changes/reconcile-institutional-profile-with-target-v1/verify-shared-migrations-baseline.mjs
```

El guard es read-only y autocontenido. Verifica presencia local de los cinco commits, rutas y blobs del árbol `dc2a2d84a91e2484b9959812ba80cd7f8db151ac`, hashes de contenido actuales y el diff final contra ese commit:

```text
git diff --quiet dc2a2d84a91e2484b9959812ba80cd7f8db151ac -- backend/prisma/migrations/20260920120000_add_institutional_profile/migration.sql backend/prisma/migrations/20260922120000_add_institutional_board/migration.sql
```

Cualquier commit, ruta, blob o diferencia faltante produce stderr y salida distinta de cero. El guard no contacta remotos ni muta Git, archivos o DB.
