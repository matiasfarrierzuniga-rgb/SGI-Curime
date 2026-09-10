## Context

La Home pública usa `DM Serif Display` para headings, `DM Sans` para interfaz y tokens Curime de ivory, verde profundo, mostaza/maíz, terracota y sage. `ServicesSection` comienza actualmente con un borde sage genérico. El divider debe reforzar continuidad entre Hero y Services sin añadir una nueva sección ni cambiar el ritmo existente.

## Goals / Non-Goals

**Goals:**

- Derivar una greca horizontal de geometría aprobada de la identidad oficial CURIME.
- Mantener el motivo como decoración fina, fluida y de bajo contraste visual.
- Reusar el componente sin acoplarlo a contenido o dominio.
- Preservar layout, spacing contract, headings, landmarks y destinos actuales.

**Non-Goals:**

- Reproducir el logo, sello, perfil o composición completa de marca.
- Diseñar el patrón modular o el acento puntual en esta fase.
- Introducir CSS ornamental complejo, gradients, motion o dependencias externas.

## Decisions

### SVG asset plus presentational wrapper

`greca-horizontal.svg` será el recurso visual aprobado y `CurimeGrecaDivider.tsx` controlará su presentación. SVG permite conservar proporciones geométricas y evitar aproximaciones CSS imprecisas. El componente debe exponer solo props mínimas si son necesarias para color o className; no debe contener lógica de negocio.

### Approved motif source

El motivo puede derivar líneas, módulos, diagonales, simetrías o ritmos geométricos visibles en assets oficiales CURIME. No puede recomponer el logo completo, alterar sus proporciones, inventar símbolos con significado institucional ni usar una copia del logo como divisor. El asset debe documentarse y revisarse visualmente contra la identidad oficial antes de aprobarse.

### ViewBox and responsive behavior

El SVG debe usar un `viewBox` horizontal estable, con altura interna reducida y `preserveAspectRatio="none"` solo si la geometría tolera estiramiento; en caso contrario debe conservar proporción y usar ancho fluido con `overflow-hidden` controlado por el consumidor. No debe definir dimensiones que creen scroll horizontal. La altura visual debe permanecer pequeña entre 320px y 1440px+.

### Color strategy

Priorizar `currentColor` en el SVG y aplicar un token existente desde el componente. La primera integración debe usar un tono sage/verde institucional de intensidad discreta, evitando una segunda línea sage de igual peso. No añadir tokens globales para Phase 1.

### Section transition

El divider se coloca en el límite superior de `ServicesSection`. Debe reemplazar el borde sage actual o integrarse con él únicamente si el borde queda visualmente subordinado. No modifica padding, grid, orden de servicios, heading ni CTAs.

## Accessibility

El SVG y wrapper serán `aria-hidden="true"`, no tendrán texto, foco, interacción ni significado semántico. Usarán `pointer-events-none` cuando la implementación lo requiera. No deben alterar headings, landmarks, skip-link, focus-visible ni targets táctiles.

## Risks / Trade-offs

- Motivo demasiado parecido al logo: limitar derivación a geometría parcial y revisar contra assets oficiales.
- Saturación visual: un solo divider primario en la sección; no combinarlo con pattern/accent.
- Distorsión responsive: probar todos los breakpoints y conservar proporción o recorte controlado.
- Doble divisor: retirar o reducir el borde sage existente.
- Sobrearquitectura: no crear Pattern, Accent ni assets futuros hasta tener consumidor aprobado.

## Validation Plan

Daniel ejecutará validación enfocada después de implementación: tests públicos enfocados, arquitectura, build, `npm run verify` y revisión manual responsive en 320, 375, 768, 1024, 1280 y 1440+. La implementación no ejecutará suites automáticamente.
