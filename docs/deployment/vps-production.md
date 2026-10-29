# SGI-Curime: preparación de VPS

Esta configuración es independiente de `compose.yaml` y no inicia ni modifica el entorno local. La aplicación se publica en un único origen HTTPS: el navegador usa `/api`, Caddy quita ese prefijo antes de enviar la solicitud a NestJS y sirve el frontend para el resto de las rutas.

## Topología y requisitos

- VPS Linux con Docker Engine y el plugin Compose, DNS de un dominio real apuntando al VPS, y puertos TCP 80/443 (más UDP 443 si se desea HTTP/3) disponibles. No usar `example.invalid` para solicitar certificados.
- Solo Caddy publica puertos. `frontend` y `backend` están en la red `web` sin puertos del host. PostgreSQL está en la red interna `data`, compartida solo con `backend`.
- Caddy gestiona y renueva automáticamente certificados válidos y redirige HTTP a HTTPS. Sus datos en `caddy_data` deben persistir.
- `postgres_data` y `uploads` son volúmenes persistentes. `UPLOAD_DIR=/app/uploads`; el servicio existente escribe en `/app/uploads/justifications`. El proxy no sirve ese directorio. Las descargas siguen pasando por los endpoints autorizados.
- El contenedor backend arranca con `NODE_ENV=production`. La cookie de refresh es `HttpOnly`, `Secure` y `SameSite=lax`. `FRONTEND_URL` y `APP_PUBLIC_URL` son `https://SITE_DOMAIN`; CORS acepta solo ese origen. Express confía exactamente en el salto de Caddy para IP del cliente y límites de solicitudes; no se debe publicar el puerto del backend ni añadir un proxy adicional sin revisar esa configuración.
- El frontend se compila con `VITE_API_URL=/api`. Esa variable es visible en el navegador y no debe incluir secretos. La API no usa prefijo propio; Caddy lo elimina al reenviar.

## Variables y secretos

Copiar `deploy/production.env.example` **fuera del repositorio** a `/etc/sgi-curime/production.env`. Proteger el archivo con propietario de despliegue y modo `0600`. Rellenar `SITE_DOMAIN`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`, `DIRECT_URL` y `JWT_SECRET`. Las dos URL deben apuntar a `postgres:5432` dentro de la red privada; codificar caracteres reservados de la contraseña en la URL. No copiar secretos locales ni mostrar `docker compose config` sin `--quiet` en registros compartidos.

Generar `JWT_SECRET` con un generador criptográfico, por ejemplo `openssl rand -base64 48`, e introducir el resultado directamente en el archivo privado. No versionarlo ni imprimirlo en el informe de despliegue. Conservarlo entre reinicios: rotarlo invalida sesiones vigentes. Los valores de TTL, bloqueo y rate limit tienen defaults en `compose.prod.yaml`; revisarlos según la operación real.

El servicio de correo actual admite `fake`, `resend` y `gmail-app-password`. Para el primer arranque sin envíos, mantener `EMAIL_PROVIDER=fake` y `EMAIL_SEND_ENABLED=false`; el registro comunitario y la recuperación de acceso que dependen de correo no completarán su entrega real. Antes de abrir el registro público, configurar un remitente y dominio verificados: `EMAIL_PROVIDER=resend`, `EMAIL_FROM`, `EMAIL_SEND_ENABLED=true`, `RESEND_API_KEY` (opcionalmente `EMAIL_FROM_NAME`, `EMAIL_REPLY_TO`, `RESEND_TIMEOUT_MS`). Alternativamente, usar `EMAIL_PROVIDER=gmail-app-password` con `GMAIL_USER` y `GMAIL_APP_PASSWORD`. No poner claves en Compose ni habilitar envíos en el entorno local. Verificar entrega en un entorno de pruebas y con destinatarios autorizados antes de producción.

## Validación y despliegue, solo cuando se autorice

Desde la raíz del repositorio en el VPS, con la configuración privada ya preparada:

```sh
docker compose -f compose.prod.yaml --env-file /etc/sgi-curime/production.env config --quiet
docker compose -f compose.prod.yaml --env-file /etc/sgi-curime/production.env build
docker compose -f compose.prod.yaml --env-file /etc/sgi-curime/production.env up -d postgres
docker compose -f compose.prod.yaml --env-file /etc/sgi-curime/production.env run --rm backend npx prisma migrate status --config prisma.config.ts
```

Revisar el resultado de `migrate status` y las migraciones pendientes antes de continuar. En una instalación con datos previos, tomar respaldo restaurable y probarlo en aislamiento. Aplicar solo migraciones revisadas y aditivas:

```sh
docker compose -f compose.prod.yaml --env-file /etc/sgi-curime/production.env run --rm backend npx prisma migrate deploy --config prisma.config.ts
docker compose -f compose.prod.yaml --env-file /etc/sgi-curime/production.env up -d
docker compose -f compose.prod.yaml --env-file /etc/sgi-curime/production.env ps
curl -fsS https://SU_DOMINIO/ >/dev/null
curl -fsS https://SU_DOMINIO/api/health/ready
```

La migración no se ejecuta automáticamente al arrancar el backend. No usar `migrate reset`, `db push --force-reset` ni comandos que borren volúmenes. Comprobar inicio de sesión, registro, adjuntos y flujos principales con cuentas de prueba autorizadas. Caddy solo podrá obtener el certificado cuando DNS y puertos estén preparados. El endpoint `/api/health/ready` devuelve `{"status":"ok"}` si PostgreSQL responde y un 503 genérico si no.

## Respaldo y restauración aislada

Usar un directorio privado de respaldos con espacio suficiente y acceso restringido. Los comandos siguientes son **ejemplos para el VPS autorizado**, no se deben ejecutar contra el Docker local actual. Sustituir `/ruta/privada/respaldo` y el archivo de entorno antes de usarlos. El volcado no escribe contraseñas en la línea de comandos ni en la salida; el propio archivo contiene datos personales y requiere cifrado y control de acceso.

```sh
docker compose -f compose.prod.yaml --env-file /etc/sgi-curime/production.env exec -T postgres sh -c 'export PGPASSWORD="$POSTGRES_PASSWORD"; pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner' > /ruta/privada/respaldo/postgres.dump
docker compose -f compose.prod.yaml --env-file /etc/sgi-curime/production.env exec -T backend tar -C /app/uploads -czf - . > /ruta/privada/respaldo/uploads.tar.gz
cd /ruta/privada/respaldo
sha256sum postgres.dump uploads.tar.gz > SHA256SUMS
sha256sum -c SHA256SUMS
pg_restore --list postgres.dump >/dev/null
tar -tzf uploads.tar.gz >/dev/null
```

Mantener copias cifradas **fuera del VPS**, con retención y prueba periódica de restauración. Para una copia coherente de base y adjuntos, detener temporalmente las escrituras de la aplicación mediante una ventana de mantenimiento autorizada antes de tomar ambos respaldos. `pg_restore` en el comando de inspección anterior requiere el cliente PostgreSQL instalado en el host; también puede ejecutarse dentro de un contenedor PostgreSQL aislado.

Para ensayar la restauración, preparar `/etc/sgi-curime/restore.env` con valores propios y una base vacía, y comprobar que el proyecto `sgi-curime-restore` no contiene datos valiosos. Desde la raíz del repositorio:

```sh
docker compose -p sgi-curime-restore -f compose.prod.yaml --env-file /etc/sgi-curime/restore.env config --quiet
docker compose -p sgi-curime-restore -f compose.prod.yaml --env-file /etc/sgi-curime/restore.env up -d postgres
docker compose -p sgi-curime-restore -f compose.prod.yaml --env-file /etc/sgi-curime/restore.env exec -T postgres sh -c 'export PGPASSWORD="$POSTGRES_PASSWORD"; pg_restore --exit-on-error --no-owner -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < /ruta/privada/respaldo/postgres.dump
docker compose -p sgi-curime-restore -f compose.prod.yaml --env-file /etc/sgi-curime/restore.env run --rm --no-deps --entrypoint tar backend -C /app/uploads -xzf - < /ruta/privada/respaldo/uploads.tar.gz
```

Esperar a que la base aislada esté sana antes de `pg_restore`; el volumen aislado de adjuntos debe estar vacío. Verificar sumas, recuentos y lectura de un adjunto de prueba. **Nunca** dirigir la restauración a `sgi-curime-prod` ni al proyecto Docker local en uso.

## Riesgos previos a publicación

- Aún se requiere un dominio real, configuración DNS, firewall y un proveedor de correo verificado. Ninguno se configura en este repositorio.
- El almacenamiento de adjuntos y los volúmenes de Caddy y PostgreSQL son locales al VPS: planificar respaldos externos y recuperación ante pérdida del servidor.
- Verificar el build de imágenes y una prueba HTTP completa en un VPS o entorno desechable antes de anunciar producción. `docker compose config --quiet` valida sintaxis e interpolación, pero no confirma TLS, permisos del volumen ni entrega de correos.
