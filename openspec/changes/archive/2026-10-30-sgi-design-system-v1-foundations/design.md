# Design

## Context

Ver `proposal.md` para motivación y `specs/design-system-foundation/spec.md` para el contrato normativo. En el baseline `e122acdb2d1e42112bb2386a50ac3123e5aaac96`, `main.tsx` importa primero `tailwind.css` y luego `index.css`; por tanto, selectores globales legacy pueden sobrescribir la base moderna por orden de cascada.

La evidencia actual contiene tres contradicciones que DS-F1 debe resolver sin rediseñar pantallas:

1. `CONVENTIONS.md` documenta valores teal históricos, mientras `tailwind.css` implementa Nicoya Contemporáneo con verde bosque, rojo, maíz, café y marfil.
2. `CONVENTIONS.md` presenta TanStack Form como piloto activo, pero `package.json` y consumidores reales usan React Hook Form con Zod.
3. `tailwind.css` contiene tokens y capas modernas, mientras `index.css` todavía aplica reglas globales funcionales a botones, campos, tablas, modales, feedback, shell y páginas legacy.

Cambios activos o archivados de arquitectura frontend, formularios, Home pública, grecas y shell ERP aportan evidencia compatible. DS-F1 no reabre sus contratos ni modifica sus componentes.

## Goals / Non-Goals

**Goals:**

- Fijar precedencia y responsabilidades de las fuentes visuales sin cambiar arquitectura ni comportamiento.
- Reconciliar convenciones con valores, herramientas y consumidores verificables en código.
- Establecer un modelo de tokens marca → semántica → contexto/componente que preserve aliases actuales.
- Clasificar CSS legacy y definir condiciones verificables para su retiro gradual.
- Definir gobernanza suficiente para impedir nuevas duplicaciones antes de diseñar otras familias.
- Separar trabajo documental de cualquier modificación CSS posterior.

**Non-Goals:**

- Reorganizar `shared/ui`, crear carpetas nuevas o renombrar exports.
- Modificar primitivas, formularios, fechas, calendarios, tablas, feedback, layouts o pantallas.
- Definir APIs, variantes o estrategia definitiva para familias DS-F2 en adelante.
- Reemplazar Base UI, shadcn-compatible local components, React Hook Form, Zod, Lucide o Tailwind.
- Eliminar reglas legacy solo porque exista una primitiva moderna equivalente.
- Cambiar backend, Prisma, API, rutas, permisos, autenticación o RBAC.

## Decisions

### 1. Precedencia de fuentes de verdad

La precedencia para DS-F1 será:

1. `AGENTS.md` y `frontend/AGENTS.md`: límites de autoridad, arquitectura y seguridad; no se modifican en este cambio salvo autorización independiente.
2. `frontend/src/tailwind.css`: valores técnicos ejecutables de tokens, tipografía, breakpoints y base global moderna.
3. `frontend/CONVENTIONS.md`: contrato humano reconciliado con código y reglas de adopción.
4. `frontend/src/index.css`: compatibilidad legacy, no fuente para nuevos estilos.
5. OpenSpec: requisitos, decisiones, tareas y evidencia de cada incremento aprobado.

Si documentación y CSS vuelven a divergir, la discrepancia se registra como deuda y no se corrige silenciosamente. Cambiar un valor institucional requiere un cambio posterior con evidencia de marca, análisis de consumidores y aprobación específica.

**Alternativa descartada:** tratar `CONVENTIONS.md` histórico como autoridad sobre valores actuales. Sustituiría tokens ejecutables sin evidencia y causaría regresiones transversales.

### 2. Paleta y capas de tokens

La identidad baseline es la implementada en `tailwind.css`:

| Rol de marca | Token | Valor baseline |
|---|---|---|
| Verde institucional | `--color-brand-green` | `#2f4a38` |
| Rojo institucional | `--color-brand-red` | `#b03a2e` |
| Maíz/ocre | `--color-brand-maize` | `#c98a2d` |
| Café institucional | `--color-brand-brown` | `#4a2f1a` |
| Marfil | `--color-brand-ivory` | `#faf4ea` |

El modelo de consumo será:

```text
marca estable
    ↓
semántica global: foreground / background / surface / border / focus / status
    ↓
contexto: público / acceso / ERP
    ↓
componente: interaction, control, card, overlay y aliases compatibles
```

Tokens de marca no expresan éxito, error, warning o selección. Tokens ERP pueden diferenciar canvas, navegación, acción y foco dentro del mismo sistema institucional. Los aliases `brand-deep`, `brand-primary`, `brand-soft`, `brand-accent`, `brand-ink` y `brand-sage` permanecen como puente hasta inventariar todos sus consumidores.

Duplicados o aliases de estado existentes se inventarían antes de consolidarse. DS-F1 no renombra tokens consumidos ni modifica valores solo para obtener una taxonomía más limpia.

**Alternativa descartada:** reemplazar público y ERP por una sola paleta plana. Borraría diferencias contextuales aprobadas y ampliaría el riesgo sin beneficio funcional.

### 3. Escalas visuales vigentes

`CONVENTIONS.md` referenciará las escalas ejecutables de `tailwind.css` en vez de duplicar listas que puedan quedar obsoletas:

- spacing semántico y de UI;
- radios de control, superficie y overlay;
- bordes semánticos;
- alturas `compact`, default y large;
- sombras/elevación;
- container máximo;
- breakpoints 320, 375, 768, 1024 y 1440 px;
- duraciones y z-index vigentes.

Un valor puntual puede permanecer local cuando solo resuelve una composición. Un token nuevo requiere al menos dos consumidores previsibles o una decisión transversal explícita, nombre semántico, evidencia responsive y revisión de compatibilidad.

**Alternativa descartada:** tokenizar cada medida encontrada. Aumenta API visual sin reutilización demostrada.

### 4. Contrato tipográfico y transición compatible

DM Sans es la fuente predeterminada para interfaz, navegación, formularios, tablas, diálogos, reportes, body y headings funcionales. DM Serif Display se usa mediante `--font-heading` solo en títulos display o expresivos institucionales aprobados. La escala semántica vigente (`display`, `heading-1..3`, `body-*`, `label`, `caption`, `navigation`) gobierna tamaño y line-height.

El selector base actual que aplica `--font-heading` a todo `h1`, `h2` y `h3` se clasificará como puente de compatibilidad. No se retirará en bloque durante DS-F1: primero se inventarían consumidores y se distinguirán headings display de headings funcionales. Hasta completar esa migración, la convención documentará la excepción actual y prohibirá ampliar su dependencia.

**Alternativa descartada:** cambiar todos los headings a DM Sans en un solo commit. El impacto atraviesa sitio público, acceso y ERP y no tiene evidencia visual suficiente por consumidor.

### 5. Estados y accesibilidad como contrato transversal

Cada patrón o componente futuro deberá declarar solo los estados que le aplican, pero cubrirlos completamente: default, hover, active, focus-visible, disabled, loading e invalid. Focus usa señal de al menos 3 px y offset suficiente según el fondo; disabled y loading conservan nombre/estado perceptible; invalid asocia campo y mensaje; estado nunca depende solo de color.

Validación futura registra WCAG 2.2 AA aplicable, teclado, foco, contraste, 320/375/768/1024/1440 px y `prefers-reduced-motion`. DS-F1 documenta estos gates, pero no certifica retroactivamente cada consumidor existente.

**Alternativa descartada:** declarar cumplimiento global a partir de tokens. El cumplimiento depende también de combinaciones, DOM, texto, foco y comportamiento renderizado.

### 6. Responsabilidades de `tailwind.css` e `index.css`

`tailwind.css` posee:

- import y configuración CSS-first de Tailwind v4;
- `@theme` y tokens ejecutables;
- base moderna y focus global;
- reducción de movimiento;
- adaptadores globales vigentes cuya librería o contexto los requiere;
- utilidades compartidas modernas justificadas.

`index.css` conserva:

- normalización mínima todavía necesaria;
- aliases legacy;
- selectores usados por rutas legacy no migradas;
- compatibilidad temporal para controles, tablas, overlays, feedback, layouts y páginas antiguas.

No se añadirá estilo moderno nuevo a `index.css`. Cada bloque legacy deberá poder asociarse con consumidores, reemplazo previsto, riesgo y condición de retiro. Debido al orden de imports, toda regla global de `index.css` se considera capaz de sobrescribir Tailwind y requiere revisión de especificidad/cascada.

**Alternativa descartada:** mover o borrar todo `index.css`. Sus consumidores incluyen superficies funcionales no migradas y el alcance no autoriza reescrituras.

### 7. Formularios: contrato vigente, no migración

`CONVENTIONS.md` se reconciliará con evidencia actual: React Hook Form administra ciclo de formulario y Zod valida esquemas mediante el resolver vigente. El backend sigue siendo fuente de verdad de reglas de dominio. TanStack Form quedará descrito como evaluación histórica/deferida, no como instrucción activa.

DS-F1 no modifica `FormField`, `Field`, controles, schemas, payloads ni pantallas. Cualquier sustitución futura exige proposal independiente, consumidor piloto y evidencia comparativa.

**Alternativa descartada:** conservar dos patrones “activos” para flexibilidad. Incentivaría decisiones distintas sin consumidor ni criterio de salida.

### 8. Taxonomía y gobernanza de componentes

Sin mover carpetas, la clasificación conceptual será:

| Categoría | Responsabilidad | Ubicación vigente preferida |
|---|---|---|
| Primitiva | Control genérico, accesible, tipado, sin dominio | `shared/ui` |
| Patrón | Composición reusable de primitivas con contrato transversal | `shared/ui` solo con consumidores demostrados |
| Marca | Presentación institucional sin lógica de negocio | `shared/ui/brand` + assets oficiales |
| Dominio | Datos, estados, permisos o reglas específicas | `features/<domain>` |
| Composición app | Providers, rutas y layouts globales | `app` |

Antes de agregar una primitiva, patrón, variante o propiedad compartida se documentarán: problema, consumidores, API, estados, accesibilidad, responsive, compatibilidad y pruebas. Reutilizar `shared/ui` es preferente cuando su contrato encaja; no se fuerza una primitive genérica a representar lógica de dominio.

Base UI es la base interactiva preferida cuando ya resuelve foco/teclado; shadcn designa el patrón de componentes locales y editables, no una segunda librería runtime. Lucide sigue como fuente habitual de iconografía funcional. Assets y motivos Curime aprobados se preservan.

**Alternativa descartada:** reorganizar `shared/ui` por carpetas durante Foundations. Generaría cambios masivos de imports sin mejorar el contrato.

### 9. Incremento documental, compatibilidad y evidencia

DS-F1 ejecutará solamente trabajo documental:

1. Reconciliar `CONVENTIONS.md`, registrar fuente de verdad, taxonomía, formularios, estados y política legacy.
2. Actualizar el seguimiento OpenSpec de este cambio.

`tailwind.css`, `index.css`, componentes, pantallas y pruebas son evidencia de lectura. Este incremento no permite comentarios, clasificación ni correcciones dentro de CSS.

El inventario legacy DS-F1 documenta categorías funcionales, selectores críticos y consumidores representativos, con reemplazo previsto, riesgo y condición de retiro. No produce un mapa selector-a-selector completo. Un cambio CSS posterior deberá ampliar el inventario hasta el nivel necesario para los selectores que pretenda cambiar.

Cada familia posterior tendrá OpenSpec propio. Foundations no aprueba por anticipado DatePicker, CalendarView, DataTable, Dialog u otras APIs.

## Risks / Trade-offs

- **[Documentación vuelve a divergir]** → referenciar tokens ejecutables y exigir revisión conjunta en cambios transversales.
- **[Aliases duplicados parecen deuda eliminable]** → conservarlos hasta completar mapa de consumidores y pruebas de regresión.
- **[Cascada de `index.css` altera primitivas modernas]** → registrar categoría y selectores críticos ahora; un cambio CSS posterior inventaría selector y consumidor antes de editar.
- **[Cambio tipográfico global produce regresión visual]** → clasificar selector base como puente y migrar por consumidor en fases futuras.
- **[Gobernanza demasiado abstracta]** → exigir evidencia concreta, archivos, consumidores y criterios de aceptación en cada tarea.
- **[Solapamiento con cambios activos]** → DS-F1 no modifica archivos de pantallas ni contratos de `sgi-forms-v1`, Home, dashboard, footer o shell.
- **[Cumplimiento accesible sobredeclarado]** → distinguir requisito propuesto, implementación y validación; no marcar PASSED sin evidencia ejecutada.

## Migration Plan

1. Confirmar baseline, árbol limpio y solapamientos OpenSpec antes de Apply.
2. Ejecutar tareas documentales sobre `frontend/CONVENTIONS.md` y seguimiento OpenSpec; no modificar `AGENTS.md`.
3. Documentar categorías CSS legacy, selectores críticos y consumidores representativos, sin editar ni retirar CSS.
4. Registrar toda corrección CSS necesaria como propuesta posterior independiente, con consumidores, evidencia visual y rollback; detenerse si requiere tocar componentes o pantallas.
5. Ejecutar validación documental/estructural. Evidencia responsive, contraste o teclado de un consumidor se obtiene solo en su cambio renderizado posterior.
6. Rollback: revertir únicamente documentación y seguimiento DS-F1; no hay cambios de CSS, datos, API ni dependencias.
