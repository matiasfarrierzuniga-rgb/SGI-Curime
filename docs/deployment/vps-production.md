# SGI-Curime: preparación de VPS

Esta configuración es independiente de `compose.yaml` y no inicia ni modifica el entorno local. La aplicación se publica en un único origen HTTPS: el navegador usa `/api`, Caddy quita ese prefijo antes de enviar la solicitud a NestJS y sirve el frontend para el resto de las rutas.

## Topología y requisitos

- VPS Linux con Docker Engine y el plugin Compose, DNS de un dominio real apuntando al VPS, y puertos TCP 80/443 (más UDP 443 si se desea HTTP/3) disponibles. No usar `example.invalid` para solicitar certificados.
- Solo Caddy publica puertos. `frontend` y `backend` están en la red `web` sin puertos del host. PostgreSQL está en la red interna `data`, compartida solo con `backend`.
- Caddy gestiona y renueva automáticamente certificados válidos y redirige HTTP a HTTPS. Sus datos en `caddy_data` deben persistir.
- `postgres_data` y `uploads` son volúmenes persistentes. `UPLOAD_DIR=/app/uploads`; el servicio existente escribe en `/app/uploads/justifications`. El proxy no sirve ese directorio. Las descargas siguen pasando por los endpoints autorizados.
- El backend final ejecuta Node como usuario `node` e incluye solo dependencias de producción. La imagen separada `migrate`, del perfil `tools`, conserva la CLI Prisma y los archivos de migración. En volúmenes de adjuntos preexistentes, verificar que el UID del contenedor pueda escribir sin alterar ni borrar archivos; los volúmenes nuevos heredan los permisos preparados en la imagen.
- El contenedor backend arranca con `NODE_ENV=production`. La cookie de refresh es `HttpOnly`, `Secure` y `SameSite=lax`. `FRONTEND_URL` y `APP_PUBLIC_URL` son `https://SITE_DOMAIN`; CORS acepta solo ese origen. Express confía exactamente en el salto de Caddy para IP del cliente y límites de solicitudes; no se debe publicar el puerto del backend ni añadir un proxy adicional sin revisar esa configuración.
- El frontend se compila con `VITE_API_URL=/api`. Esa variable es visible en el navegador y no debe incluir secretos. La API no usa prefijo propio; Caddy lo elimina al reenviar.

## Variables y secuencia de despliegue

El contrato de cuentas, la separación de archivos root:root 0600, el orden de migraciones, la barrera de grants y las decisiones pendientes están en [postgres-privileges.md](postgres-privileges.md). La aplicación no debe arrancar hasta verificar migraciones, bootstrap y grants. La URL migradora se carga solo para las herramientas; el backend recibe únicamente DATABASE_URL limitada. Mantener EMAIL_PROVIDER=resend y EMAIL_SEND_ENABLED=false durante la preparación. Las operaciones de base y el despliegue requieren autorización separada.

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
