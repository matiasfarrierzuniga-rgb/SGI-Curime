# Proposal

## Why

El dashboard administrativo no reproduce de forma integral el wireframe aprobado, por lo que composición, densidad y jerarquía visual difieren de la referencia institucional. Se requiere cerrar esa brecha sin sustituir datos reales, contratos, permisos ni procesos existentes.

## What Changes

- Reproducir la composición completa del wireframe aprobado: sidebar verde, topbar con búsqueda visual, banner institucional, cuatro KPI, tres paneles centrales y tres paneles inferiores.
- Adaptar tamaños, espaciados, color, iconografía, tipografía, cards y estados interactivos dentro de la identidad SGI-Curime.
- Presentar exclusivamente datos provenientes de APIs existentes, usuario autenticado y capacidades actuales.
- Mantener posiciones visuales para fuentes aún inexistentes mediante estados vacíos claros; no mostrar métricas, tendencias, eventos ni porcentajes fabricados.
- Capturar una revisión visual completa a 1536 × 1024 antes de declarar la implementación terminada.

## Capabilities

### New Capabilities

Ninguna. Este cambio no agrega comportamiento de producto ni contratos funcionales.

### Modified Capabilities

Ninguna. No cambian requisitos funcionales existentes; sólo presentación visual dentro de comportamientos actuales.

## Impact

- Afecta el shell ERP y la presentación de `frontend/src/features/admin-dashboard`.
- No modifica APIs, backend, autenticación, RBAC, rutas, modelo de datos ni Home pública.
- Usa assets institucionales públicos ya versionados y las fuentes existentes del dashboard, solicitudes autorizadas, eventos públicos y, cuando las capacidades vigentes lo permiten, reservas y asambleas para el calendario institucional.
