# Registro y activación comunitaria: etapa 1

**Estado:** implementación en revisión; validación y despliegue pendientes.

## Objetivo y alcance

El documento proporcionado el 3 de noviembre de 2026 sustituye, para este incremento, la propuesta histórica que solicitaba contraseña durante el registro. El formulario solicita identificación, nombres, correo, teléfono opcional y aceptación; la contraseña se define al activar mediante el enlace. Se mantiene separado el flujo histórico de solicitudes y activación administrativa. No se modifica la lógica de afiliación, los cargos institucionales, el acceso a módulos, el proveedor de correo configurado ni la gestión administrativa de listados.

Las referencias propuestas a CU-20, CU-21 y CU-22 proceden de `docs/decisions/community-account-registration.md`; el catálogo V2 inmutable sigue **NOT_VERIFIED**. La especificación anterior de OpenSpec describe la contraseña en el primer paso y debe reconciliarse mediante una revisión explícita antes de integrar.

## Contratos y compatibilidad

- `POST /community-accounts/register`: recibe los campos personales y la aceptación sin contraseña, y crea una cuenta `PENDING_EMAIL_VERIFICATION`.
- `POST /community-accounts/validate-token`: comprueba el enlace sin consumirlo.
- `POST /community-accounts/verify-email`: recibe token, contraseña y confirmación; consume el token y guarda el hash en una transacción. Los tokens comunitarios emitidos previamente siguen siendo válidos para el nuevo formulario, pero el contrato anterior que activaba con solo token deja de estar disponible. Los tokens de activación administrativa histórica mantienen su propósito y endpoint separados.
- `POST /community-accounts/resend-verification`: conserva la política de invalidación y límites existente. La corrección de un correo inaccesible está pendiente de un mecanismo de prueba de identidad y no debe resolverse únicamente mediante la identificación.
- El bloqueo administrativo rechaza activación de cuentas pendientes y revisa tokens comunitarios sin consumir. La interpretación histórica de `usedAt` y las cuentas con historial ausente requieren certificación con datos sintéticos antes de desplegar.

## Base de datos y recuperación

La migración preparada añade tres columnas `TEXT` anulables para conservar nombres y apellidos por separado. No modifica ni rellena filas existentes. Prisma consulta estas columnas una vez regenerado, por lo que el código nuevo requiere aplicar la migración aprobada antes de desplegar. No se ha ejecutado contra ninguna base. Revertir código y esquema requiere un plan revisado: eliminar columnas después de registrar cuentas descartaría sus datos estructurados; priorizar reparación hacia adelante y respaldo restaurable.

`User.identification` ya es único por número sin discriminar tipo. El requisito nuevo de unicidad por tipo y número no puede certificarse como idéntico al índice actual sin una decisión de esquema y un análisis de compatibilidad; esta etapa conserva la restricción existente. No se vinculan identidades existentes automáticamente.

## Pruebas y exclusiones

Ejecutar pruebas unitarias focalizadas de DTO, registro, tokens, contraseña, entrega, activación administrativa y login; pruebas frontend para formulario, validación y activación. La certificación de concurrencia, migración y compatibilidad de datos requiere PostgreSQL desechable y autorización separada. La configuración integrada usa correo simulado: la aceptación del proveedor fake no demuestra entrega real. No se envían correos reales en pruebas.

Resultado local: **PASSED** siete suites unitarias backend (57 pruebas), incluida la compatibilidad del flujo administrativo histórico; después se repitió la suite de registro con el caso adicional de conflicto concurrente simulado (**12 pruebas PASSED**). Tres suites frontend pasaron (**14 pruebas PASSED**). Ambos builds, la comprobación de arquitectura frontend y el lint específico de los archivos cambiados pasaron. El lint frontend global falló por la declaración duplicada de `activityDay` en `AdminDashboard.test.tsx`, heredada de `e93a402`; no se modificó ese archivo ni se ejecutó `npm run verify` completo. La prueba inicial de ESLint concurrente con la regeneración de Prisma falló por tipos temporalmente no resueltos; la repetición después de generar pasó.

**NOT_EXECUTED:** migración, integración PostgreSQL, concurrencia real, entrega real de correo, revisión visual y certificación integral de sesiones y accesos. Los errores de auditoría y entrega visibles durante algunas pruebas proceden de escenarios simulados.
