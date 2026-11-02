# Proposal

## Why

SGI-Curime ya dispone de tokens institucionales y primitivas compartidas, pero `frontend/CONVENTIONS.md`, `frontend/src/tailwind.css`, `frontend/src/index.css` y la adopción real de formularios describen contratos parcialmente contradictorios. Se necesita una base verificable antes de ampliar o migrar familias de componentes, para evitar nuevas duplicaciones y preservar el funcionamiento actual.

## What Changes

- Documentar `frontend/src/tailwind.css` como fuente técnica de verdad existente para identidad, tokens de marca y semánticos, tipografía, espaciado, radios, bordes, elevación, controles y breakpoints.
- Reconciliar `frontend/CONVENTIONS.md` con la paleta institucional Nicoya Contemporáneo actualmente implementada, incluyendo las diferencias intencionales entre sitio público y ERP.
- Definir el contrato tipográfico de DM Sans para interfaz y DM Serif Display solo para encabezados display aprobados, junto con la escala semántica vigente.
- Documentar requisitos verificables para focus visible, hover, active, disabled, loading, invalid, contraste, teclado, responsive y reducción de movimiento.
- Delimitar documentalmente responsabilidades: `tailwind.css` contiene Tailwind v4, tokens, base y componentes globales vigentes; `index.css` conserva compatibilidad legacy. El inventario DS-F1 cubre categorías, selectores críticos y consumidores representativos; un inventario exhaustivo queda para un cambio CSS posterior que lo necesite.
- Reconocer React Hook Form + Zod como patrón de formularios realmente utilizado y retirar la referencia de TanStack Form como patrón activo, sin modificar formularios ni primitivas en esta fase.
- Definir gobernanza entre primitivas genéricas de `shared/ui`, patrones reutilizables y componentes de dominio en `features`, con adopción incremental y compatibilidad obligatoria.
- Preservar arquitectura `app → features → shared`, Tailwind v4, Base UI/shadcn, Lucide, assets institucionales y contratos existentes, sin dependencias ni reorganización de carpetas.

No hay cambios incompatibles de API, persistencia, autorización, rutas o comportamiento de negocio.

## Capabilities

### New Capabilities

- `design-system-foundation`: Define fuentes de verdad, identidad, tokens, tipografía, estados accesibles, responsabilidades CSS y gobernanza para la evolución compatible del frontend SGI-Curime.

### Modified Capabilities

- Ninguna. `architecture/baseline-documentation` y `erp-shell-presentation` permanecen sin cambios; esta capacidad consume sus límites vigentes sin redefinirlos.

## Impact

- **Primer Apply autorizado:** exclusivamente `frontend/CONVENTIONS.md` y el seguimiento de tareas OpenSpec de este cambio. Reconciliará convenciones con la evidencia actual y registrará gobernanza.
- **CSS explícitamente excluido:** `frontend/src/tailwind.css` y `frontend/src/index.css` se consultan como evidencia y no se modifican. Cualquier cambio CSS requiere autorización y propuesta posterior con selector o token, consumidores, evidencia visual y rollback.
- **Evidencia consultada, no objetivo de refactor:** `frontend/src/shared/ui/**`, `frontend/package.json`, layouts y consumidores actuales.
- **Arquitectura preservada:** `app → features → shared`; componentes de dominio no se trasladan a `shared` sin independencia y reutilización demostradas.
- **Stack preservado:** React, TypeScript, Tailwind CSS 4, Base UI/shadcn, Lucide, React Hook Form y Zod; no se agregan dependencias.
- **Exclusiones explícitas:** componentes, formularios, calendarios, tablas, feedback, shell, sitio público, CSS, pruebas, dependencias, backend, Prisma, API, rutas, RBAC y archivos `AGENTS.md` no cambian.
- **Trazabilidad:** la auditoría DS-F1 y el código en HEAD `e122acdb2d1e42112bb2386a50ac3123e5aaac96` son baseline de propuesta. Casos de uso V2 permanecen `NOT_VERIFIED`: este cambio transversal no inventa identificadores CU ni altera comportamiento funcional.
