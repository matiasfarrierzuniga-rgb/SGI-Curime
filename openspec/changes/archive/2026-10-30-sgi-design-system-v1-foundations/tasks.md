# Tasks

## 1. DS-US01.1 — Tokens y convenciones (documental)

- [x] 1.1 Reconciliar en `frontend/CONVENTIONS.md` la fuente de verdad y la paleta baseline (`brand-green`, `brand-red`, `brand-maize`, `brand-brown`, `brand-ivory`) con `frontend/src/tailwind.css`; **evidencia:** tabla comparativa token/valor/rol y diff documental; **aceptación:** no quedan valores teal históricos presentados como vigentes y los aliases compatibles se identifican sin eliminarlos; **dependencias:** proposal, spec y design DS-F1 aprobados; **riesgo:** convertir aliases en deprecaciones no autorizadas.
- [x] 1.2 Documentar en `frontend/CONVENTIONS.md` las capas marca → semántica → contexto/componente y las diferencias permitidas entre público, acceso y ERP; **evidencia:** referencias verificadas a grupos de tokens actuales; **aceptación:** color de marca no se usa como significado de estado y ERP permanece dentro de identidad Curime; **dependencias:** 1.1; **riesgo:** homogeneizar contextos que tienen contratos visuales distintos.
- [x] 1.3 Documentar escalas vigentes de spacing, radios, bordes, alturas, sombras, contenedor y breakpoints por referencia a `frontend/src/tailwind.css`; **evidencia:** checklist contra `@theme`; **aceptación:** 320/375/768/1024/1440 px y criterios para token nuevo quedan explícitos sin duplicar valores innecesariamente; **dependencias:** 1.1; **riesgo:** crear una segunda lista que vuelva a divergir.

## 2. DS-US01.2 — CSS moderno y legacy (documental)

- [x] 2.1 Inventariar en `frontend/CONVENTIONS.md` categorías CSS legacy, selectores críticos y consumidores representativos de `frontend/src/index.css`; **evidencia:** búsquedas de selectores críticos en `frontend/src`, categoría, riesgo, reemplazo previsto y condición de retiro; **aceptación:** botones, campos, tablas, overlays, feedback, layouts y páginas legacy quedan clasificados sin borrar ni editar CSS ni afirmar inventario exhaustivo; **dependencias:** 1.1–1.3; **riesgo:** asumir que una clase sin coincidencia simple carece de consumidor dinámico.
- [x] 2.2 Definir en `frontend/CONVENTIONS.md` responsabilidades de `tailwind.css`, `index.css` y su orden de importación en `frontend/src/main.tsx`; **evidencia:** contrato de ownership y advertencia de cascada; **aceptación:** nuevos estilos modernos no se dirigen a `index.css` y toda retirada legacy exige mapa de consumidores; **dependencias:** 2.1; **riesgo:** describir intención futura como migración ya realizada.
- [x] 2.3 Confirmar separación documental/código mediante diff; **archivos de implementación permitidos:** `frontend/CONVENTIONS.md` y seguimiento OpenSpec DS-F1; **evidencia:** `git diff --name-only` sin cambios en `tailwind.css`, `index.css`, componentes o pantallas; **aceptación:** cualquier contradicción CSS ejecutable se registra como seguimiento y no se corrige en este Apply documental; **dependencias:** 2.1–2.2; **riesgo:** expandir alcance para “limpiar” estilos funcionales.

## 3. DS-US01.3 — Tipografía (documental)

- [x] 3.1 Reconciliar en `frontend/CONVENTIONS.md` DM Sans como fuente general y DM Serif Display como fuente display aprobada, junto con la escala semántica; **evidencia:** comparación con tokens tipográficos de `tailwind.css` y carga de fuentes en `frontend/index.html`; **aceptación:** no se autoriza otra familia ni tamaños arbitrarios de página; **dependencias:** 1.3; **riesgo:** interpretar “heading” como autorización automática de serif para todo encabezado.
- [x] 3.2 Registrar el selector global actual de `h1/h2/h3` en `tailwind.css` como puente de compatibilidad pendiente de inventario, sin modificarlo; **evidencia:** excepción explícita y criterio de migración por consumidor en `CONVENTIONS.md`; **aceptación:** el target tipográfico y el baseline actual quedan diferenciados; **dependencias:** 3.1; **riesgo:** provocar un cambio tipográfico transversal no validado.

## 4. DS-US01.4 — Estados visuales y accesibilidad (documental)

- [x] 4.1 Definir en `frontend/CONVENTIONS.md` el contrato para componentes nuevos o adoptados: default, hover, active, focus-visible, disabled, loading e invalid; **evidencia:** matriz estado/señal/semántica/teclado aplicable; **aceptación:** foco, loading, disabled e invalid no dependen solo de color y se declara que DS-F1 no certifica consumidores heredados; **dependencias:** 1.2–1.3; **riesgo:** exigir estados no aplicables a todos los componentes.
- [x] 4.2 Documentar gates futuros WCAG 2.2 AA, teclado, reducción de movimiento y responsive 320/375/768/1024/1440; **evidencia:** checklist verificable y referencia a `prefers-reduced-motion` vigente; **aceptación:** la convención distingue contrato para cambios nuevos de evidencia PASSED de cada consumidor y no certifica retroactivamente la aplicación; **dependencias:** 4.1; **riesgo:** declarar cumplimiento global solo por existencia de tokens.

## 5. DS-US01.5 — Contrato documental de formularios

- [x] 5.1 Corregir en `frontend/CONVENTIONS.md` la matriz tecnológica y sección de formularios para reconocer React Hook Form + Zod como patrón activo; **evidencia:** `frontend/package.json` y consumidores con `useForm`/`zodResolver`; **aceptación:** TanStack Form queda como evaluación histórica o futura, no patrón vigente; **dependencias:** ninguna tarea de componentes; **riesgo:** convertir esta corrección documental en migración de formularios.
- [x] 5.2 Documentar criterios para evaluar otra herramienta de formularios; **evidencia:** regla de proposal independiente, consumidor piloto, necesidad medida y compatibilidad; **aceptación:** `FormField`, controles, schemas, payloads y pantallas permanecen fuera de cambios; **dependencias:** 5.1; **riesgo:** duplicar patrones activos sin criterio de salida.

## 6. DS-US01.6 — Gobernanza de componentes

- [x] 6.1 Añadir a `frontend/CONVENTIONS.md` la taxonomía conceptual de primitiva, patrón, marca, dominio y composición app; **evidencia:** ejemplos reales de `frontend/src/shared/ui`, `shared/ui/brand`, `features` y `app`; **aceptación:** la taxonomía respeta `app → features → shared` y no mueve archivos; **dependencias:** 1.2 y límites de arquitectura vigentes; **riesgo:** reclasificar componentes específicos como shared solo por su apariencia.
- [x] 6.2 Definir criterios para primitives, variantes y contratos compartidos; **evidencia:** checklist de problema, consumidores, API, estados, accesibilidad, responsive, compatibilidad y pruebas; **aceptación:** se reutiliza `shared/ui` cuando encaja y no se crea abstracción sin reutilización demostrada; **dependencias:** 6.1 y 4.1–4.2; **riesgo:** sobregobernanza sin evidencia concreta.
- [x] 6.3 Documentar adopción gradual y relación entre `AGENTS.md`, `frontend/AGENTS.md`, `CONVENTIONS.md` y OpenSpec; **evidencia:** precedencia y gate de cambio explícitos; **aceptación:** AGENTS no se modifica, OpenSpec no sustituye contratos implementados y cada familia pendiente requiere alcance propio; **dependencias:** 6.1–6.2; **riesgo:** usar DS-F1 para aprobar APIs de DatePicker, tablas, feedback o shell.

## 7. Integración documental y validación

- [x] 7.1 Revisar coherencia completa de `frontend/CONVENTIONS.md` contra `frontend/package.json`, `frontend/src/tailwind.css`, `frontend/src/index.css`, `frontend/src/main.tsx` e inventario `frontend/src/shared/ui/**`; **evidencia:** revisión de referencias y ausencia de contradicciones conocidas; **aceptación:** objetivos DS-US01.1–01.6 quedan cubiertos y hallazgos fuera de alcance se registran sin corregirlos; **dependencias:** 1–6; **riesgo:** ampliar alcance a deuda de componentes.
- [x] 7.2 Ejecutar `cmd /c openspec validate sgi-design-system-v1-foundations --strict` y `git diff --check`; **evidencia:** ambas salidas exitosas; **aceptación:** artefactos y documentación son estructuralmente válidos, sin ejecutar tests, lint ni build de aplicación; **dependencias:** 7.1; **riesgo:** confundir validación documental con validación runtime.
- [x] 7.3 Confirmar alcance final con `git diff --name-only`, `git status --short` y revisión de diff; **evidencia:** solo `frontend/CONVENTIONS.md` y artefactos OpenSpec DS-F1; **aceptación:** no hay cambios en AGENTS, CSS, componentes, pantallas, pruebas, dependencias, backend o stashes; **dependencias:** 7.2; **riesgo:** incorporar cambios ajenos al reporte o futuro commit.

## Seguimiento de código no autorizado por este Apply documental

- Evaluar correcciones en `frontend/src/tailwind.css` o `frontend/src/index.css` únicamente mediante autorización posterior que identifique selector/token, consumidores, evidencia visual y rollback.
- Migrar el selector tipográfico global por consumidores, no como cambio transversal no medido.
- Crear propuestas separadas para formularios, fechas/calendarios, tablas, feedback, shell y demás familias de SGI Design System V1.
