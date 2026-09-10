## Why

La Home pública usa colores, tipografías y composición institucionales de ADI Curime, pero requería motivos CURIME consistentes para reforzar transiciones y secciones institucionales sin cambiar comportamiento funcional ni saturar la página.

## What Changes

- Phase 1: crear `CurimeGrecaDivider` y `greca-horizontal.svg`; consumirlo en la transición Hero -> Services y reemplazar el divisor sage genérico.
- Phase 2: crear `CurimeGrecaPattern` y `greca-pattern.svg`; consumirlo únicamente como textura tonal de baja intensidad en `TransparencySection`, reemplazando el anillo sage.
- Phase 3: crear `CurimeBrandAccent` y `maize-mark.svg`; consumirlo únicamente como acento institucional fuera de flujo en `AboutSection`.
- Mantener intactos contenido, navegación, auth, rutas, CTAs, estado, capacidades y lógica de dominio.
- Definir reglas de fidelidad, accesibilidad, responsive y uso limitado del motivo.

## Out Of Scope

- Ajustes en `PublicHeader`, logo, Hero, `PublicFooter`, auth, backend, ERP, rutas, dependencias, tests y módulos internos.
- Gradientes, animación, motion, nuevos tokens globales o reinterpretación del logo completo.
- Páginas públicas adicionales, consumidores adicionales, assets no usados o iconografía funcional.

## Architecture

Los componentes visuales de marca reutilizables y sin lógica de dominio pertenecen a `frontend/src/shared/ui/brand/`. Los motivos SVG institucionales estables pertenecen a `frontend/public/brand/motifs/`. Cada componente tiene un consumidor real y cada asset está usado por ese componente.

## Impact

- Componentes: `CurimeGrecaDivider.tsx`, `CurimeGrecaPattern.tsx`, `CurimeBrandAccent.tsx` y sus consumidores `ServicesSection.tsx`, `TransparencySection.tsx` y `AboutSection.tsx`.
- Assets: `greca-horizontal.svg`, `greca-pattern.svg`, `maize-mark.svg`.
- No hay cambios en APIs, rutas, capacidades, autenticación, contratos ni dependencias.
