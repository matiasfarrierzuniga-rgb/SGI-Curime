# SGI-Curime backend

API modular NestJS para procesos comunitarios e institucionales. La autorización efectiva se resuelve en servidor desde `User`, `Role`, `RolePermission` y `Permission`; labels de rol, cargos de Junta, afiliación y datos enviados por navegador no conceden acceso.

## Contratos vigentes

- Roles y asignaciones ejecutables: `src/auth/domain/policies/canonical-role-grants.ts`.
- Registro comunitario: [`../docs/contracts/account-lifecycle-v1.md`](../docs/contracts/account-lifecycle-v1.md). C3-AUTH-01 registra por correo, verifica y activa sin aprobación ordinaria `UserRequest`.
- Gobernanza: `Person`, `User`, `Affiliate`, `GovernanceMembership` y RBAC son dominios distintos. Secretaría mantiene períodos y nombramientos mediante capacidades efectivas; un nombramiento no asigna ni revoca un software role automáticamente.
- Solicitudes de afiliación siguen su flujo propio; los `UserRequest` de registro comunitario son evidencia histórica y no restauran endpoints o grants retirados.

Código y contratos vigentes de la rama de trabajo prevalecen sobre reportes y OpenSpec históricos. Estos se conservan para trazabilidad, pero no redefinen endpoints, grants ni reglas implementadas.

## Desarrollo

```bash
npm install
npm run start:dev
```

## Validación

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# coverage
npm run test:cov
```

No ejecute tests mutativos, migraciones, seeds, sincronización RBAC, resets o backfills contra PostgreSQL de desarrollo sin autorización explícita, entorno identificado y procedimiento recuperable. `npm run lint` aplica correcciones; úselo solo cuando una fase de verificación autorizada lo permita.

## Development status

Inventario operativo, gestión de Junta, flujos autorizados de afiliación, administración de cuentas centrada en User, eventos V2 y C3-AUTH-01 forman el baseline implementado de esta rama. La certificación final de producción permanece pendiente.
