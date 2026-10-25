# Backend — instrucciones locales para SGI-Curime

Aplican además las reglas del `../AGENTS.md` raíz. Un solo agente ejecutor puede trabajar aquí; este archivo no configura un subagente.

## Tecnología y límites

- Backend: NestJS + TypeScript + Prisma 7 + PostgreSQL 17; aplica las reglas vigentes de `docs/architecture/backend-layer-rules.md` y los módulos actuales.
- Revisa controladores, DTO, casos de uso, repositorios, módulos, tests y schema real **antes** de cambiar un contrato. No inventes rutas, eventos, campos, estados, capacidades ni relaciones.
- Antes de cambiar comportamiento funcional, identifica los CU V2 relacionados y contrástalos con controladores, DTO, casos de uso, schema, pruebas y contratos V1 reales. Registra evidencia o estado `NOT_VERIFIED`; el catálogo no prueba implementación.
- Separa endpoint público, autenticado y protegido por capacidades. El backend decide la autorización. Roles y permisos deben verificarse en registros persistidos, sin confiar en los datos recibidos del cliente.
- No mezcles cargos institucionales, membresía en Junta Directiva o condición de afiliado con el software Role. La autorización sobre registros propios exige comprobar el vínculo/alcance de negocio además de la capacidad.

## Registro comunitario — alcance de este incremento

Lee `../docs/decisions/community-account-registration.md` y distingue **AS-IS** de **TO-BE propuesto**:

- AS-IS: `POST /register` crea `UserRequest(PENDING)`; el flujo de aprobación crea `User(INACTIVE)` con `AccountActivationToken`; `POST /auth/activate-account` activa y fija contraseña.
- TO-BE (NO IMPLEMENTADO): autoservicio con nombre, correo y contraseña, verificación de correo y rol comunitario mínimo; sin aprobación de Junta Directiva para una cuenta normal.
- La cuenta verificada NO acredita identidad legal ni autoriza acceso a una `Person`, `Affiliate`, `Venture` o expediente preexistente.
- Conserva el flujo histórico de UserRequest y el bootstrap de administradores. Define una transición compatible; nunca elimines datos porque ahora el registro público cambia de significado.
- Antes de implementar determina el impacto en `User.identification` obligatorio, unicidad, `Person.personId`, estados de cuenta, tokens existentes, reenvío y rate limiting. Cualquier alteración del modelo congelado exige OpenSpec/decisión/migración/rollback explícitos.
- Usa tokens aleatorios almacenados como hash, con expiración, un solo uso y no exposición en logs. Almacena contraseñas solo como hash seguro según la infraestructura del proyecto.
- Protege registro, reenvío y recuperación frente a abuso y enumeración de cuentas. No emitas sesión válida antes de verificar correo; el rol público no debe incluir capacidades administrativas.
- Para aprobación de emprendimientos, no concedas `ent.ventures.create`, `ent.ventures.update` o `ent.ventures.publish` a usuarios comunitarios por defecto; la propuesta de registro y la gestión autorizada son procesos distintos.
- Voluntariado no exige `User` ni `Affiliate`; preserva las postulaciones públicas cuando el módulo correspondiente esté habilitado.

## Pruebas y seguridad de datos

- Recomienda primero pruebas unitarias de validaciones, tokens, estados, permisos y anti-replay. Después pruebas HTTP/contrato y, con autorización y DB desechable, integración PostgreSQL.
- Desde `backend/`: `npm test -- --runInBand` ejecuta pruebas unitarias; `npm run build` genera artefactos; `npm run lint` **modifica archivos con `--fix`** y no debe usarse en EXPLORE ni contra cambios ajenos.
- `npm ci` puede lanzar `postinstall` que genera el cliente Prisma; no ejecutar durante exploración de solo lectura.
- Nunca correr `db:seed`, migraciones, backfill, reset ni tests mutativos en la base Docker del proyecto sin autorización, respaldo y estado recuperable. Examinar primero `DATABASE_URL` sin imprimir credenciales.
- Informar resultados como `NOT_EXECUTED`, `PASSED`, `FAILED` o `NOT_APPLICABLE` con evidencia. No certificar entrega de correo por la mera existencia del servicio.
