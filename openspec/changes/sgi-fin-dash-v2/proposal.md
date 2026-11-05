# Proposal

## Why

El área financiera carece de una vista consolidada que permita comprender movimientos, cargos y actividad reciente sin recorrer pantallas separadas. Se propone un Dashboard Financiero V2 basado exclusivamente en contratos y capacidades existentes, con acceso parcial coherente y sin presentar cifras ficticias ni interpretaciones contables no aprobadas.

## What Changes

- Incorporar la ruta propuesta `/app/financial/dashboard` dentro de `ErpLayout`, sin sustituir `/app/financial`, `/app/financial/movements`, `/app/financial/dinadeco` ni `/app/donations`.
- Presentar el resumen del mes seleccionado con ingresos, egresos y balance registrado obtenidos de `GET /financial/movements/summary`.
- Construir una evolución de seis meses mediante seis resúmenes mensuales no superpuestos, con barras agrupadas, valores CRC y tooltip accesible.
- Mostrar el estado actual de cargos mediante tres consultas filtradas por `PENDING`, `PAID` y `CANCELLED`, usando el campo paginado `total` y no los elementos de la página visible.
- Mostrar una página pequeña de movimientos recientes en el orden vigente del backend y permitir navegar al historial y al detalle existente.
- Componer el dashboard según `fin.movements.read` y `fin.charges.read`; ocultar bloques y accesos no autorizados sin asumir equivalencias entre capacidades.
- Mantener fallos independientes por bloque, además de estados de carga, vacío, error y acceso denegado accesibles y responsive.
- Ampliar la invalidación posterior al registro de pagos para refrescar cargos, movimientos, resúmenes y visualizaciones derivadas afectadas.
- Añadir pruebas focalizadas de contratos, autorización completa/parcial/ausente, límites temporales, caché, estados visuales y viewports requeridos.

## Scope

- FIN-DASH-01 a FIN-DASH-06.
- Frontend financiero dentro de la arquitectura `app -> features -> shared`.
- Integración con endpoints, modelos, capacidades y librerías ya existentes.
- Reutilización de `ErpLayout`, primitivas UI, tokens institucionales, DM Sans, Recharts y Lucide React.

## Exclusions

- Cambios a contratos backend, Prisma, migraciones o datos.
- Capacidades, roles o permisos RBAC nuevos.
- Sustitución o rediseño funcional de Cargos, Movimientos, Donaciones o DINADECO.
- Refinamiento de formularios o modales de cargos, movimientos y DINADECO.
- Nuevos cálculos comparativos, porcentajes, saldo disponible, conciliación o categorías contables inferidas.
- Instalación o actualización de dependencias.

## Capabilities

### New Capabilities

- `financial-dashboard`: Resumen financiero autorizado con indicadores de movimientos, evolución temporal, distribución actual de cargos, actividad reciente, navegación contextual y estados resilientes.

### Modified Capabilities

- Ninguna.

## Dependencies

- Selección humana de una rama base estable antes de APPLY.
- Revisión de integración y compatibilidad de las PR #111, #117 y #118 antes de APPLY; esta propuesta no presume que estén fusionadas.
- Conservación de los contratos vigentes de `GET /financial/movements/summary`, `GET /financial/movements` y `GET /financial/charges`.
- Decisión de implementación para permitir una ruta compartida con disyunción de capacidades existentes, sin relajar el acceso ERP ni crear una capacidad nueva.

## Impact

- Afectaría en APPLY la composición de rutas y navegación en `frontend/src/app/`, y el feature existente `frontend/src/features/financial/`, incluidos hooks, claves de consulta, UI y pruebas.
- No requiere cambios backend: los endpoints ya aplican `fin.movements.read`, `fin.charges.read` y `fin.payments.record` de forma independiente.
- La ruta compartida requerirá extender de manera acotada el guard frontend para aceptar cualquiera de las dos capacidades de lectura, preservando autenticación, `canAccessErp` y default-deny.
- La invalidación de pagos deberá incluir las familias de consultas de cargos y movimientos porque registrar un pago crea un movimiento de ingreso y cambia el estado del cargo.
