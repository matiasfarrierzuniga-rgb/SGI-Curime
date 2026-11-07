# SGI_CORE_REFACTOR_BUILD_FIX_01_REPORT

## Estado

- Incremento: `IMPLEMENTED_NOT_VERIFIED`
- Rama esperada: `feature/daniel`
- PostgreSQL, SQL, migraciones, seeds, reconciliación y HTTP real: `NOT_EXECUTED`.
- Commit, push y merge: `NOT_EXECUTED`.

## Archivos corregidos

- `backend/prisma/reconcile-persons.ts`
- `backend/prisma/reconcile-persons.spec.ts`
- `backend/src/user-requests/activation-token-delivery.service.ts`
- `backend/src/user-requests/activation-token-delivery.service.spec.ts`
- `backend/src/user-requests/user-requests.service.spec.ts`

## Contratos modificados

### Reconciliación

`toSource()` ahora acepta `fullName: string | null`, igual que `IdentitySource`.

`isUserReconciliationCandidate()` excluye una cuenta `User` cuando:

- `personId = null`; y
- `fullName = null` o solo espacios.

No se inventa identidad, no se usa correo como identidad y no se crean candidatos de reconciliación para cuenta comunitaria email-only sin `Person` ni nombre. Cuentas vinculadas o cuentas históricas con nombre siguen entrando al flujo existente.

El archivo deja de ejecutar `main()` al ser importado por una prueba; solo ejecuta reconciliación bajo `require.main === module`.

### Activación histórica

`ActivationDelivery.fullName` ahora es `string | null`.

La entrega conserva correo, token, vencimiento y usuario. Si no existe nombre, solo `recipientName` usa `persona de la comunidad` como saludo de presentación. No persiste valor ficticio ni altera aprobación, JWT, sesiones, RBAC o SMTP.

## Pruebas actualizadas

- Nueva prueba de adaptación de fuentes de reconciliación:
  - excluye `User` sin `Person` ni nombre;
  - conserva `fullName: null` sin sustitución;
  - conserva candidatos vinculados o históricos con nombre.
- Nueva prueba de entrega de activación sin nombre: verifica saludo genérico.
- Nueva prueba de aprobación histórica con `result.user.fullName = null`: verifica que el valor nullable llega a la capa de presentación.

## Validación

| Comprobación | Estado | Evidencia |
|---|---|---|
| Inspección focalizada de ambos errores | `PASSED` | Tipos y llamadas corregidos |
| Revisión estática de contrato nullable | `PASSED` | `toSource` y `ActivationDelivery` aceptan `string \| null` |
| Prisma / PostgreSQL | `NOT_EXECUTED` | Prohibido por alcance |
| Script de reconciliación | `NOT_EXECUTED` | Prohibido por alcance |
| Pruebas focalizadas | `NOT_EXECUTED` | Harness PowerShell no inicia comandos |
| Build backend | `NOT_EXECUTED` | Harness PowerShell no inicia comandos |
| `git diff --check` | `NOT_EXECUTED` | Harness PowerShell no inicia comandos |

Comandos humanos seguros, sin ejecutar reconciliación ni conectarse a PostgreSQL:

```powershell
cd backend
npm test -- --runInBand prisma/reconcile-persons.spec.ts src/user-requests/activation-token-delivery.service.spec.ts src/user-requests/user-requests.service.spec.ts
npm run build
```

```powershell
git diff --check
git status --short --branch
```

## Riesgos pendientes

1. Build final depende de ejecución humana tras `prisma generate` ya completado por equipo.
2. Exclusión de cuenta email-only es intencional: no crea manifest ni revisión manual porque carece de evidencia de identidad.
3. Retiro físico de snapshots `User.fullName` sigue sujeto a reconciliación humana aprobada; este cambio no modifica schema ni migraciones.
