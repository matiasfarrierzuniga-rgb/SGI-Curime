# Separación PostgreSQL — borrador no certificado

Base: PR #156. No desplegar sin revisar y validar el procedimiento y los privilegios efectivos.

## Contrato
La imagen inicializa un administrador con POSTGRES_USER/PASSWORD. Crear roles con deploy/postgres-init-roles.sql como administrador en una base nueva identificada, usando psql -v ON_ERROR_STOP=1. Establecer contraseñas independientes con \password en sesión privada y sin registrar terminal. No enviar contraseñas en argumentos ni SQL versionado. La base debe permitir CONNECT a ambos roles; revisar PUBLIC y restringir conexiones según política.

DATABASE_URL corresponde a sgi_backend. MIGRATION_DATABASE_URL corresponde a sgi_migrator y se mapea a DATABASE_URL y DIRECT_URL exclusivamente para migrate. Mantener URL migradora en un archivo root:root 0600 distinto del archivo de runtime; pasar ambos archivos --env-file únicamente en comandos de herramientas. No imprimir docker compose config ni inspecciones con variables.

## Orden
1. Validar identidad del VPS, base vacía, volumen y respaldo. Crear roles, esquema y contraseñas bajo custodia.
2. Con backend detenido, aplicar migraciones con migrate como sgi_migrator; ejecutar deploy/postgres-grant-runtime.sql como migrador tras cada migración. El backend no debe arrancar si falla cualquier paso.
3. Comprobar deploy/postgres-privileges-check.sql como administrador y ejecutar pruebas funcionales y negativas con sgi_backend. Ejecutar bootstrap mínimo de PR #156 como migrador por stdin con sus guardas y confirmación explícita.
4. Para futuras migraciones repetir respaldo, detener escrituras/backend, migrar, aplicar grants y verificar antes de arrancar.

El backend ejecuta un control de identidad y grants al iniciar y falla cerrado si faltan permisos o si la cuenta es privilegiada. Este control no sustituye comprobar migraciones aplicadas ni detecta alteraciones posteriores al arranque; detener el backend durante migraciones. No hay grants predeterminados a tablas: otorgarlos automáticamente incluiría _prisma_migrations. Las secuencias futuras reciben USAGE y SELECT por default privileges del rol migrador. Tablas nuevas requieren ejecutar el script de grants antes de arrancar backend. Los roles no son un límite frente a un administrador Docker o PostgreSQL.

## Recuperación
Mantener dumps PostgreSQL y adjuntos cifrados fuera del VPS, con claves separadas y restauración ensayada. pg_dump de una base no respalda roles globales; reconstruir roles y grants desde procedimiento y gestor de secretos antes de restaurar. Nunca restaurar sobre producción sin autorización y destino comprobado. Ante falla detener backend y restaurar respaldo verificado en destino autorizado; no resetear migraciones ni borrar volúmenes.

## Verificación pendiente
NOT_EXECUTED: Compose, PostgreSQL 17, las 41 migraciones, bootstrap, grants, operaciones reales, lint/build y restauración. Revisar los INSERT existentes en ReservableResource e InstitutionalProfile y registrar sus efectos antes de producción. No se han creado credenciales productivas.

## Custodia y respaldo acordados
Archivos bajo /etc/sgi-curime con directorio root:root 0700 y archivos root:root 0600. La credencial migradora va exclusivamente en tools.env; generar secretos independientes criptográficamente en una ventana autorizada y conservarlos en un gestor institucional con MFA y acceso de emergencia probado. No registrar valores ni compartir la clave Resend, limitada a envío del dominio; EMAIL_SEND_ENABLED=false durante preparación.

Respaldar base y uploads en ventana coherente, cifrar antes de salir del VPS y guardar la clave fuera del VPS y del destino. Propuesta: diario, 7 diarios, 5 semanales y 12 mensuales; comprobar integridad y ensayar restauración aislada. Pendiente aprobar gestor y custodios, proveedor y costos, retención, RPO/RTO y responsabilidades de recuperación. No almacenar secretos junto con el backup.
