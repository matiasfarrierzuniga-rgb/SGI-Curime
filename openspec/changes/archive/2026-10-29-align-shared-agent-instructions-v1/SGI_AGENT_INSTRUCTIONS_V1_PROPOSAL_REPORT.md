# SGI_AGENT_INSTRUCTIONS_V1_PROPOSAL_REPORT

## 1. Estado

- **Fase:** PROPOSE.
- **Cambio:** `align-shared-agent-instructions-v1`.
- **IMPLEMENTED:** no.
- **PROPOSED:** alineación documental de instrucciones compartidas, skills SGI, política Git y adaptador Copilot.
- **NOT_VERIFIED:** contenido futuro todavía no aplicado; Rulesets remotos, comportamiento de agentes después de APPLY y revisión humana.
- **Código, API, RBAC, Prisma y runtime:** sin cambios.
- **Apply y Archive:** no ejecutados ni autorizados por esta fase.

## 2. Evidencia operativa preservada

- Rama observada al iniciar: `feat/erp-shell-refinement-v1`.
- HEAD observado: `8624d1f` (`feat(erp-shell): finalize sidebar and header refinement v1`).
- Rama adelantada un commit respecto a su upstream en la evidencia consultada.
- Cambio rastreado ajeno preservado: `frontend/src/app/layouts/ErpLayout.tsx`.
- Directorios y archivos untracked preservados: copias de skills frontend para varios proveedores, `frontend/pnpm-lock.yaml` y `frontend/skills-lock.json`.
- No se creó worktree, no se cambió rama y no se ejecutó commit, push, merge, Apply o Archive.

## 3. Problemas específicos

1. **Arquitectura frontend contradictoria:** `frontend/CONVENTIONS.md` y verificaciones actuales establecen `app -> features -> shared`, pero `sgi-frontend-architecture` todavía ilustra raíces horizontales como destino.
2. **Tipografía contradictoria:** las autoridades rastreadas permiten DM Serif Display para headings aprobados, mientras `sgi-frontend-design` declara DM Sans como familia única y equipara ambos tokens tipográficos.
3. **Política Git divergente del objetivo:** `AGENTS.md` y `CONTRIBUTING.md` envían cambios directamente a `main`; el objetivo solicitado propone PRs a `development` y promoción revisada a `main` estable.
4. **Fases incompletamente explicitadas:** el ciclo existe, pero falta dejar inequívoco que Archive también requiere autorización independiente y evidencia previa.
5. **Worktrees:** no existe una regla directa y compacta que prohíba crearlos sin autorización explícita.
6. **Skills duplicadas:** existen copias equivalentes para distintos proveedores; falta formalizar que son mirrors y no autoridades acumulativas.
7. **Validación:** conviven gates amplios con tareas documentales de bajo riesgo; falta una regla proporcional y estados uniformes de evidencia.
8. **Copilot:** no existe `copilot-instructions.md`; una copia completa de AGENTS produciría drift.
9. **Design System:** varios componentes importantes aún no tienen contrato propio y no deben presentarse como implementados.
10. **Estado operativo histórico:** `PROJECT-STATE.md` contradice Git actual y requiere reconciliación separada, no edición incidental.

## 4. Archivos documentales candidatos para APPLY

| Archivo | Cambio propuesto | Condición |
|---|---|---|
| `AGENTS.md` | Precedencia, skills selectivas, fases, worktrees, validación, política Git y Design System futuro | Requerido |
| `CONTRIBUTING.md` | Topic branch → PR a `development` → promoción revisada a `main` | Requerido para evitar contradicción |
| `.github/pull_request_template.md` | Distinguir PR de integración y promoción; no afirmar Rulesets activos | Requerido para coherencia Git |
| `.github/copilot-instructions.md` | Adaptador delgado que referencia autoridades existentes | Propuesto |
| `.agents/skills/sgi-frontend-architecture/SKILL.md` | Sustituir organización horizontal por slices vigentes y capabilities | Requerido |
| `.agents/skills/sgi-frontend-design/SKILL.md` | Alinear DM Sans/DM Serif Display y tokens semánticos | Requerido |
| `frontend/AGENTS.md` | Solo cross-reference mínima si raíz no basta | Condicional |
| `frontend/CONVENTIONS.md` | Solo referencias o nota de Design System V1; no reescribir contratos vigentes | Condicional |
| `backend/AGENTS.md` | Ningún cambio identificado | No modificar salvo evidencia nueva |
| `PROJECT-STATE.md` | Ninguno | Excluido; requiere reconciliación propia |

No se modificarán skills genéricas instaladas, copias por proveedor, documentación histórica, Sidebar, dependencias ni archivos runtime.

## 5. Redacción propuesta de reglas importantes

### Autoridad

> Resolver instrucciones en este orden: alcance explícito aprobado; contratos backend, dominio y capabilities vigentes; `AGENTS.md` raíz; `AGENTS.md` del directorio aplicable; estándares técnicos rastreados; skills SGI locales; skills externas o específicas del proveedor. Git, código, pruebas y configuración actuales prevalecen sobre snapshots operativos desactualizados. Las contradicciones se informan; no se reparan silenciosamente.

### Ciclo OpenSpec

> `EXPLORE`, `PROPOSE`, `APPLY`, `VERIFY` y `ARCHIVE` son autorizaciones separadas. Completar una fase no autoriza la siguiente. `ARCHIVE` exige implementación completa, evidencia requerida aceptada y solicitud explícita; no ocurre automáticamente después de APPLY o VERIFY.

### Git y worktrees

> No crear worktrees, cambiar ramas, hacer stash, reset, clean, rebase, merge, commit, push o archive sin autorización explícita o contrato activo que nombre esa operación. Antes de cualquier mutación aprobada, inspeccionar y preservar trabajo tracked y untracked ajeno.

### Skills

> Seleccionar el conjunto mínimo de skills cuya especialidad coincida con la tarea. Las skills SGI locales restringen a las genéricas. Copias equivalentes para distintos proveedores son mirrors, no reglas acumulativas; usar una copia accesible y reportar drift material.

### Validación

> Ajustar validación al comportamiento y riesgo afectados. Cambios documentales validan referencias, contradicciones, formato, OpenSpec y alcance Git. Cambios runtime añaden pruebas enfocadas y gates del proyecto afectado. Migraciones, despliegues y checks destructivos requieren autorización y entorno seguro. Reportar `PASSED`, `FAILED`, `NOT_EXECUTED` o `NOT_APPLICABLE` con evidencia.

### Política Git objetivo

> Cambios compartidos de feature, fix, documentación, pruebas y configuración entran mediante rama dedicada y Pull Request hacia `development`. La promoción de `development` a `main` estable usa Pull Request revisado y validación requerida. Esto expresa política del proyecto; no demuestra que branch protections o Rulesets remotos estén activos.

### Tipografía

> Usar DM Sans para interfaz, cuerpo, controles, navegación, formularios, tablas, diálogos y reportes. Reservar DM Serif Display para headings display o institucionales aprobados mediante `--font-heading`. No introducir otra familia ni `font-family` local sin decisión aprobada de Design System.

## 6. Estrategia de descubrimiento de skills

```text
Alcance de tarea
    ↓
AGENTS raíz + AGENTS del directorio
    ↓
Estándar rastreado aplicable
    ↓
Una skill SGI primaria
    ↓
Especialistas mínimos necesarios
    ↓
Guardrail de validación, si aplica
```

| Especialidad | Skill primaria | Complementos posibles |
|---|---|---|
| Desarrollo general | `sgi-development-foundation` | Skill del stack afectado |
| Arquitectura frontend | `sgi-frontend-architecture` | React, TypeScript o Vite según necesidad |
| Diseño visual | `sgi-frontend-design` | `design-taste-frontend`, `ui-ux-pro-max`, `baseline-ui` |
| Formularios | `sgi-forms-validation` | Zod y librería de formulario vigente |
| Dashboard/navegación | `sgi-dashboard-ux` | Especialista UI |
| Responsive/a11y | `sgi-responsive-accessibility` | Auditoría de accesibilidad |
| Persistencia | Contrato backend + skill Prisma pertinente | Especialista DB solo con autorización |

No cargar todas las skills por defecto. No interpretar cada copia de proveedor como obligación independiente.

## 7. Tareas OpenSpec verificables

`tasks.md` organiza 19 tareas en seis grupos:

1. preservar baseline y exclusiones;
2. alinear gobernanza raíz y reglas locales;
3. reconciliar `development -> main` entre AGENTS, CONTRIBUTING y PR template;
4. corregir únicamente las dos skills SGI contradictorias;
5. agregar adaptador Copilot delgado y referencias futuras de Design System;
6. validar contradicciones, OpenSpec, whitespace y alcance Git.

Cada tarea incluye evidencia observable o comando. Archive queda como seguimiento no contabilizado y exige flujo separado.

## 8. Riesgos

| Riesgo | Mitigación propuesta |
|---|---|
| Política `development/main` no coincide con configuración remota | Separar política conceptual de Rulesets verificados |
| Crecimiento excesivo de `AGENTS.md` | Mantener reglas compactas; detalles en estándares y skills |
| Drift del adaptador Copilot | Referencias, no copia completa |
| Copias de skills con versiones distintas | Comparar cuando importe; informar drift, no fusionar automáticamente |
| Inclusión accidental del Sidebar o untracked | Revisar `git diff --name-only` y `git status` al cierre |
| Cambios involuntarios de RBAC/backend | Ningún cambio en contratos; revisión semántica de backend instructions |
| Presentar Design System como existente | Etiquetar todos sus elementos `PROPOSED` o pendientes |

## 9. Criterios de aceptación

- Las tres capas de instrucciones conservan su responsabilidad: raíz compartida, frontend y backend locales.
- Ninguna instrucción activa recomienda arquitectura horizontal frontend como destino.
- Tipografía coincide con `frontend/CONVENTIONS.md` y tokens vigentes.
- Cada fase OpenSpec, incluido Archive, requiere autorización propia.
- Worktrees y operaciones Git mutativas requieren autorización explícita.
- Skill selection es mínima, especializada y no acumulativa por proveedor.
- `AGENTS.md`, `CONTRIBUTING.md` y PR template expresan la misma política `development -> main`.
- Rulesets se describen como no verificados hasta obtener evidencia remota.
- Copilot recibe un adaptador delgado sin duplicación normativa.
- Backend, API, RBAC, Prisma, rutas y runtime permanecen sin cambios.
- Sidebar, skills untracked, locks, rama y worktree existentes se preservan.
- OpenSpec valida en modo estricto y el diff final no contiene archivos fuera de alcance.
- Suites de aplicación quedan `NOT_APPLICABLE` mientras el incremento siga siendo documental.

## 10. Design System V1 — alcance futuro

Quedan explícitamente fuera de este incremento y requieren especificación propia:

- botones y jerarquía de acciones;
- formularios e inputs;
- tablas y densidad de información;
- política de iconografía;
- DatePicker, DateRangePicker y CalendarView;
- toasts, diálogos y notificaciones;
- localización;
- accesibilidad detallada por componente.

El baseline actual de tokens, responsive y WCAG sigue vigente. Esta lista no afirma que exista una implementación compartida completa.

## 11. Artefactos de propuesta

- `proposal.md`
- `specs/architecture/agent-instruction-governance/spec.md`
- `design.md`
- `tasks.md`
- `SGI_AGENT_INSTRUCTIONS_V1_PROPOSAL_REPORT.md`

Siguiente fase posible: revisión humana. APPLY requiere una solicitud nueva y explícita.
