## Why

La Home pública ya usa colores, tipografías y composición institucionales de ADI Curime, pero su transición entre Hero y Services depende de un divisor genérico. Phase 1 introduce un motivo CURIME reutilizable, discreto y decorativo sin cambiar comportamiento funcional ni saturar la página.

## What Changes

- Crear `CurimeGrecaDivider` como componente presentacional y domain-neutral en `frontend/src/shared/ui/brand/`.
- Crear únicamente `frontend/public/brand/motifs/greca-horizontal.svg`.
- Consumir el divider en `ServicesSection` como transición visual Hero -> Services.
- Sustituir o reducir el divisor sage existente para evitar doble peso visual.
- Mantener intactos contenido, navegación, auth, rutas, CTAs, estado, capacidades y lógica de dominio.
- Definir reglas de fidelidad, accesibilidad, responsive y uso limitado del motivo.

## Out Of Scope

- `CurimeGrecaPattern` y `CurimeBrandAccent`; quedan diferidos.
- Cambios en `PublicHeader`, logo, `PublicFooter`, auth, backend, ERP, rutas, dependencias, tests y módulos internos.
- Gradientes, animación, motion, nuevos tokens globales o reinterpretación del logo completo.
- Nuevos consumidores o assets sin necesidad demostrada.

## Architecture

Los componentes visuales de marca reutilizables y sin lógica de dominio pertenecen a `frontend/src/shared/ui/brand/`. Los motivos SVG institucionales estables pertenecen a `frontend/public/brand/motifs/`. Phase 1 crea únicamente un componente con un consumidor real y un asset usado por ese componente.

## Impact

- Componentes: `CurimeGrecaDivider.tsx`, `ServicesSection.tsx`.
- Asset: `greca-horizontal.svg`.
- No hay cambios en APIs, rutas, capacidades, autenticación, contratos ni dependencias.
