# Proposal

## Why

La pantalla administrativa `/app/admin/affiliates` no corresponde de forma fiel al wireframe aprobado: difieren jerarquía, superficies, tabla, modal y adaptación móvil. Se requiere cerrar esa brecha visual sin inventar operaciones ni alterar contratos ya implementados para afiliados.

## What Changes

- Reproducir la pantalla principal aprobada: cabecera con icono circular, acción superior, tarjeta de filtros, tarjeta de resultados, tabla administrativa con avatares, estados, acciones y paginación integrada.
- Reproducir el detalle compacto del afiliado con identidad, estado, pestañas, datos personales y de afiliación, acciones existentes y scroll controlado.
- Reproducir diálogo de confirmación de desactivación y lista móvil, preservando semántica, foco, teclado, feedback de carga/error y comportamiento responsive.
- Mantener únicamente los contratos vigentes: listado paginado, búsqueda, estado, detalle, edición, activación y desactivación.
- Mantener visibles los controles del wireframe que aún no tienen contrato funcional, pero documentarlos como dependencias no interactivas o decisiones pendientes; no se crearán llamadas API, estados simulados ni botones ficticios.
- Establecer matriz de correspondencia, incrementos, criterios de aceptación y estrategia de comparación visual para una futura fase Apply.

## Capabilities

### New Capabilities

- `administrative-affiliates-presentation`: requisitos de presentación fiel, estados y adaptación responsive para administración de afiliados sin ampliar el contrato de dominio.

### Modified Capabilities

Ninguna. `affiliate-requests` conserva su flujo independiente de solicitudes y creación backend-owned; este cambio no modifica requisitos funcionales existentes.

## Impact

- Afecta únicamente presentación dentro de `frontend/src/features/affiliates/ui/`: `AffiliatesPage.tsx`, `AffiliateFilters.tsx`, `AffiliatesTable.tsx` y `AffiliateDetailsModal.tsx`; `EditAffiliateModal.tsx` queda fuera salvo que una inspección Apply pruebe que es indispensable para conservar el flujo modal existente.
- Conserva TanStack Query, servicios, modelos, rutas y capability vigente `adm.affiliates.read`.
- No modifica `/afiliacion`, SGI-FORMS-V1, backend, Prisma, RBAC, autenticación por correo, nombramientos, endpoints ni datos persistidos.
- Dependencias funcionales sin contrato actual: registro administrativo directo, filtro por tipo, rango de fecha, aplicación explícita mediante `Filtrar`, menú contextual, observaciones y selector de cantidad por página.
