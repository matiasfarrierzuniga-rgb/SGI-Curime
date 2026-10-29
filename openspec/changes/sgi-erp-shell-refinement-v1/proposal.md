# Proposal

## Why

El shell ERP actual ya compone navegación filtrada por capacidades, sesión y notificaciones reales, pero su presentación concentra demasiadas responsabilidades visuales en `ErpLayout`. Refinar Sidebar y Header ahora elevará jerarquía, legibilidad, respuesta adaptable y accesibilidad sin alterar rutas, permisos ni contratos de datos.

## What Changes

- Refinar presentación del Sidebar expandido, colapsado y móvil: marca, secciones, ítems, estados, ilustración institucional, scroll y acciones globales.
- Refinar presentación del Header: búsqueda no funcional explícitamente indicada, ubicación móvil, notificaciones existentes y menú de cuenta.
- Mantener agrupación institucional, navegación filtrada por `permissionCodes`, guards de rutas y autorización de API como fuentes separadas y vigentes.
- Definir medidas, estados responsive y criterios verificables para 320×568, 375×667, 768×1024, 1024×768, 1440×900 y alturas reducidas.
- Ampliar pruebas focalizadas del shell para preservar semántica, teclado, foco, navegación autorizada, drawer y estados existentes de notificaciones.
- No crear funciones de búsqueda, notificaciones, permisos, roles, rutas, APIs, dependencias ni cambios de backend.

## Capabilities

### New Capabilities
- `erp-shell-presentation`: Presentación responsive y accesible del shell ERP, preservando navegación disponible, acciones de sesión y controles ya respaldados por contratos reales.

### Modified Capabilities
- Ninguna.

## Impact

- Código previsto: `frontend/src/app/layouts/ErpLayout.tsx`, sus pruebas focalizadas y, solo si resulta imprescindible por reutilización demostrada, primitivas ya existentes de `frontend/src/shared/ui/` o estilos/tokens ERP existentes.
- Consumidores preservados: `frontend/src/app/navigation/erpNavigation.ts`, `features/auth`, `features/notifications`, React Router y Base UI.
- Sin cambios previstos a `AppRoutes`, guards, `ACCESS_CAPABILITIES`, backend, Prisma, APIs, TanStack Query, rutas, RBAC, dependencias ni módulos ERP individuales.
