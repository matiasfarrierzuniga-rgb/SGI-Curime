# Solicitudes públicas de donación — contrato de integración

El portal `/donaciones` recibe una **intención de donar**, no dinero ni bienes. `POST /public/donation-requests` crea exclusivamente `DonationRequest(PENDING)` y responde con `id` y `status`. No llama `POST /donations`, ni crea `Donation`, `FinancialMovement` o movimientos de inventario. `anonymousPublic` solo controla la eventual exposición pública del nombre; el personal con permiso de lectura ve el contacto y el nombre para coordinar.

## Datos y modalidades

Nombre y al menos correo o teléfono; sin cédula ni documentos. `MONETARY` requiere monto aproximado positivo en CRC y admite `DIGITAL` con preferencia `SINPE` o `BANK_TRANSFER`, o `IN_PERSON` sin asumir efectivo. `IN_KIND` requiere descripción de bienes y modalidad `IN_PERSON` o `COORDINATED`. Comentarios son opcionales. No se solicitan datos bancarios ni se publican cuentas o números de cobro.

## API y permisos

- `POST /public/donation-requests`: validación estricta, limitador público actual, `Idempotency-Key` de 20 a 128 caracteres, hash de clave y de datos normalizados; misma clave y datos devuelve el mismo identificador, datos distintos producen `409`.
- `GET /donation-requests` y `GET /donation-requests/:id`: JWT, acceso ERP y permiso persistido `don.requests.read`.
- `PATCH /donation-requests/:id/review`, `/reject`, `/cancel`: JWT, acceso ERP y permiso persistido `don.requests.review`. Rechazo y cancelación exigen motivo. Las transiciones condicionales evitan cambios concurrentes; cada transición y creación se audita sin datos de contacto en la bitácora.
- No hay endpoint de confirmación de recepción, emisión de recibo ni asiento desde una solicitud. La matriz canónica asigna `don.requests.read` y `don.requests.review` solo a `ROLE_SYSTEM_ADMIN` y `ROLE_INSTITUTIONAL_TREASURER`; ningún otro rol recibe esos permisos. Aplicar estos grants en otras bases requiere aprobación separada.

## Integración y límites

La migración `20261108120000_add_public_donation_requests` es aditiva. Se ensayó en un clon restaurado y en PostgreSQL desechable; se aplicó únicamente a la base local propia de SGI-Curime después de un respaldo verificado. Los cuatro grants de `don.requests.*` se aplicaron allí en una transacción; los grants pendientes de Inventario quedaron intactos. No se aplicaron migraciones ni grants remotos. Antes de habilitar este flujo en producción, definir evidencia y procedimiento de recepción, conservación y eliminación de datos de contacto, y la configuración de un limitador compartido si hay varias instancias. La confirmación contable necesita una decisión y una implementación transaccional separadas; nunca convertir una preferencia digital o un monto aproximado en prueba de pago.
