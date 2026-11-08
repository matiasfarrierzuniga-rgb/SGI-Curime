# SGI_NESTJS_START_DEV_FIX_REPORT

## Estado

`PARTIALLY_COMPLETED`

Implementación completada. Validación ejecutable pendiente porque el launcher PowerShell terminó antes de iniciar Git/npm.

## Causa raíz confirmada

`tsconfig.build.json` hereda un proyecto TypeScript que incluye código fuera de `src` (`generated`, `prisma` y otros archivos backend). Por ello, el root efectivo de compilación es el directorio `backend` y TypeScript conserva `src/` dentro de `outDir`, generando:

`dist/src/main.js`

La entrada Nest permanecía implícita como `main`. Durante `start:dev`, la resolución terminó usando `dist/main`, ruta incompatible con la salida real. No fue un error de `src/main.ts`, del build ni de funcionalidades integradas.

## Archivo corregido

`backend/nest-cli.json`

### Antes

```json
{
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

### Después

```json
{
  "sourceRoot": ".",
  "entryFile": "src/main",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

Nest queda alineado explícitamente con `dist/src/main.js`. `deleteOutDir` y compilación watch permanecen activos. No se movió `src/main.ts`.

## Compatibilidad

- `npm run start:dev`: apunta a entrada `src/main` bajo root efectivo `.`.
- `npm run build`: conserva Nest TSC y `outDir: ./dist`.
- `npm run start:prod`: permanece `node dist/src/main`.
- `src/main.ts`: sin cambios.
- Dependencias: sin cambios.

## Validaciones

| Validación | Estado | Evidencia |
|---|---|---|
| Inspección de configuración y salida | `PASSED` | `dist/src/main.js` confirmado por estructura existente |
| Rama activa | `NOT_EXECUTED` | PowerShell terminó con código 64 antes de ejecutar Git |
| `npm run build` | `NOT_EXECUTED` | No se repitieron intentos tras fallo del launcher |
| `npm run start:dev` | `NOT_EXECUTED` | No se repitieron intentos tras fallo del launcher |
| Watch/reinicio | `NOT_EXECUTED` | Requiere proceso real |
| `git diff --check` | `NOT_EXECUTED` | PowerShell no inició Git |

No se declara arranque aprobado sin ejecución verificable.

## Integridad y restricciones

- PostgreSQL: sin acceso.
- Endpoints: no probados.
- Migraciones, seeds y reconciliaciones: no ejecutados.
- `.env` y SMTP: sin cambios.
- Prisma schema y migraciones: sin cambios.
- Registro, verificación, autenticación, RBAC y nombramientos: sin cambios.
- `main` Git: sin cambios intencionales; rama activa no verificable por harness.
- Commit/push/merge/rebase: no realizados.

## Comandos humanos pendientes

Desde `backend/`:

```powershell
npm run build
Test-Path .\dist\src\main.js
npm run start:dev
```

Después de confirmar el mensaje de arranque Nest, modificar y guardar un archivo TypeScript inocuo o reiniciar manualmente para comprobar watch; detener con `Ctrl+C`.

Desde raíz:

```powershell
git diff --check
git status --short --branch
```
