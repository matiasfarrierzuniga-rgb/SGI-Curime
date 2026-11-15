# Bootstrap mínimo de producción

Estado: procedimiento versionado; su existencia no autoriza ejecución.

## Alcance

`npm run db:bootstrap:minimal` inicializa únicamente:

- seis roles canónicos;
- permisos y grants definidos por `canonical-role-grants.ts`;
- una cuenta inicial `ROLE_SYSTEM_ADMIN`;
- auditoría segura de la creación inicial.

No crea recursos de reserva, tarifas, inventario, afiliaciones ni otros datos
operativos. El comando no reemplaza migraciones y debe ejecutarse solamente
después de `prisma migrate deploy` sobre una instalación nueva aprobada.

El seed general `npm run db:seed` conserva su comportamiento histórico y no se
debe usar para el bootstrap mínimo de Hostinger.

## Entrada administrativa

La entrada es JSON con contrato exacto:

```json
{
  "fullName": "<nombre autorizado>",
  "identification": "<identificación autorizada>",
  "email": "<correo autorizado>",
  "password": "<secreto>"
}
```

Guardar temporalmente fuera del repositorio, bajo custodia administrativa, con
modo `0600`. No incluir el contenido en argumentos, variables persistentes,
logs, imágenes ni archivos Compose. La vía obligatoria es stdin
(`BOOTSTRAP_ADMIN_FILE=-`), de modo que Docker no persista el contenido en
configuración del contenedor. El archivo debe eliminarse solo mediante el
procedimiento autorizado después de verificar acceso y custodia.

## Protección del destino

El comando no acepta URLs externas, `localhost`, Supabase ni Hostinger directo.
Solo se ejecuta desde servicio `migrate` de `compose.prod.yaml` hacia
`postgres:5432` en red interna. Antes de leer la credencial, exige:

- `BOOTSTRAP_EXECUTION_CONTEXT=SGI_CURIME_COMPOSE_PRODUCTION` como confirmación
  efímera explícita;
- `BOOTSTRAP_TARGET_DATABASE`, inyectada por Compose desde `POSTGRES_DB`, igual
  al nombre de base contenido en `DATABASE_URL`.

Una URL a otro host, puerto o base falla antes de abrir Prisma. No usar el
comando directamente en host, otro Compose, Supabase o proveedores gestionados.

Ejemplo de forma operativa, solo para una ventana autorizada:

```sh
sudo sh -c 'docker compose -f compose.prod.yaml --env-file /etc/sgi-curime/production.env --profile tools run --rm -T -e BOOTSTRAP_ADMIN_FILE=- -e BOOTSTRAP_EXECUTION_CONTEXT=SGI_CURIME_COMPOSE_PRODUCTION migrate npm run db:bootstrap:minimal < /ruta/privada/bootstrap-admin.json'
```

No ejecutar el ejemplo contra Supabase, pruebas compartidas o una base cuyo
destino no haya sido comprobado previamente.

## Seguridad e idempotencia

- La contraseña usa la misma política vigente: 10–128 caracteres, mayúscula,
  minúscula y número; se almacena con bcrypt, coste 12.
- Correo se normaliza a minúsculas; identificación nunca se inventa.
- La cuenta inicial queda sin `Person`, afiliación o nombramiento automático.
- Segunda ejecución exacta no cambia contraseña, usuario ni auditoría.
- Coincidencias parciales de correo/identificación, otro administrador, rol
  inactivo, rol histórico activo o grants inesperados producen fallo cerrado.
- El comando nunca revoca grants. Reconciliación RBAC es otro procedimiento.
- Roles, grants, usuario y auditoría se escriben en una transacción serializable.
- La salida contiene solo estado y conteos; nunca datos personales o secretos.

## Preflight obligatorio

1. Confirmar commit desplegado y árbol limpio.
2. Confirmar que `DATABASE_URL` apunta a `postgres:5432` y su base coincide con
   `POSTGRES_DB`, sin imprimir credenciales.
3. Confirmar backup estructural recuperable tomado después de migraciones y
   antes del bootstrap.
4. Confirmar 41 migraciones exitosas y ninguna incompleta/revertida.
5. Confirmar autorización para crear la cuenta inicial.
6. Ejecutar una vez y comprobar login, rol, grants y auditoría.

## Recuperación

Un fallo dentro del bootstrap revierte la transacción completa. No editar
`_prisma_migrations`, no usar `migrate reset` o `db push --force-reset`, y no
borrar roles o usuarios manualmente.

Si la ejecución terminó pero debe revertirse antes de uso, restaurar el backup
estructural pre-bootstrap en entorno identificado. Después de operación real,
usar únicamente forward-fix revisado o restauración autorizada.

## Certificación

Pruebas unitarias cubren validación, destino, entrada por stdin, RBAC, identidad,
conflictos e idempotencia. La configuración de `compose.prod.yaml` se valida con
variables sintéticas para confirmar que `migrate` recibe
`BOOTSTRAP_TARGET_DATABASE`; no se muestran secretos reales.
`npm run test:postgres:bootstrap:minimal` crea PostgreSQL temporal en tmpfs,
aplica migraciones, ejecuta dos veces el bootstrap, verifica ausencia de cambios
operativos y destruye exclusivamente el contenedor que creó. Requiere las
guardas de entorno descartable del proyecto y nunca acepta puerto 5432/5433.
