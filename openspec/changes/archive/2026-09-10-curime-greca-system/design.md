## Context

La Home pública usa `DM Serif Display` para headings, `DM Sans` para interfaz y tokens Curime de ivory, verde profundo, mostaza/maíz, terracota y sage. Sistema final usa tres motivos SVG puntuales para reforzar identidad sin alterar contenido, interacción ni ritmo existente.

## Goals / Non-Goals

**Goals:**

- Derivar motivos parciales de geometría aprobada de identidad oficial CURIME, sin reproducir su logo completo.
- Mantener Divider, Pattern y Accent como decoraciones secundarias, reutilizables y sin acoplamiento de dominio.
- Aplicar una decoración principal como máximo por sección y no decorar cards, navegación ni iconografía funcional.
- Preservar layout, spacing contract, headings, landmarks y destinos actuales.

**Non-Goals:**

- Reproducir el logo, sello, perfil o composición completa de marca.
- Añadir consumidores, assets o páginas públicas adicionales.
- Introducir CSS ornamental complejo, gradients, motion o dependencias externas.

## Decisions

### Shared SVG assets and presentational wrappers

`greca-horizontal.svg`, `greca-pattern.svg` y `maize-mark.svg` son recursos SVG aprobados. Sus wrappers `CurimeGrecaDivider.tsx`, `CurimeGrecaPattern.tsx` y `CurimeBrandAccent.tsx` controlan presentación sin lógica de negocio. SVG conserva proporciones y evita aproximaciones CSS geométricas imprecisas.

### Approved motif source

Cada motivo deriva líneas, módulos, diagonales, simetrías o ritmos geométricos visibles en assets oficiales CURIME. No recompone logo, sello, perfil o marca completa, no altera sus proporciones ni inventa símbolos institucionales. Los colores usan equivalentes de tokens institucionales existentes.

### Divider

`CurimeGrecaDivider` usa SVG horizontal, `aria-hidden`, sin interacción y con altura reducida. Se consume solo al inicio de `ServicesSection` para transición Hero -> Services y reemplaza el borde sage anterior. Su ancho es fluido, con recorte controlado y sin overflow entre 320px y 1440px+.

### Pattern

`CurimeGrecaPattern` usa SVG tonal, `aria-hidden` y `pointer-events-none`. Se consume una sola vez en `TransparencySection`, sobre verde profundo y a opacidad baja. Reemplaza el anillo sage anterior, queda fuera de flujo y detrás del contenido para no afectar contraste, headings ni CTA.

### Brand accent

`CurimeBrandAccent` usa un SVG puntual inspirado en geometría/mazorca CURIME, `aria-hidden` y `pointer-events-none`. Se consume una vez en la esquina inferior izquierda de `AboutSection`, fuera de flujo, con opacidad baja y oculto antes de `md`; no desplaza ni cubre contenido.

## Accessibility

Cada SVG y wrapper es `aria-hidden="true"`, no tiene texto, foco, interacción ni significado semántico, y usa `pointer-events-none`. Ninguno altera headings, landmarks, skip-link, focus-visible ni targets táctiles.

## Risks / Trade-offs

- Motivo demasiado parecido al logo: limitar derivación a geometría parcial y revisar contra assets oficiales.
- Saturación visual: máximo una decoración principal por sección; no combinar motivos dominantes en el mismo viewport.
- Distorsión responsive: mantener recorte, opacidad y ocultamiento controlados por breakpoint.
- Legibilidad: Pattern queda detrás del contenido y Accent tiene opacidad baja.

## Validation Plan

Daniel validó el sistema final con `PublicPages.test.tsx` (18/18), build, arquitectura y `npm run verify` (65/65 archivos, 402/402 tests). La revisión manual responsive cubrió 320px, 375px, 768px, 1024px, 1280px y 1440px+. La implementación no ejecutó suites automáticamente.
