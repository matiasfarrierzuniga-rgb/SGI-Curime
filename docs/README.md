# Documentación de SGI-Curime

Estado: Vigente  
Última revisión: 2026-09  
Fuente primaria: rama `main`, pruebas y configuración vigente

## Propósito

Este directorio concentra la documentación técnica, funcional y operativa vigente de SGI-Curime.

La regla principal es simple: la documentación debe explicar el sistema que realmente existe en `main`. Los documentos históricos pueden conservarse como evidencia de evolución, pero deben estar claramente identificados para evitar confusión.

## Cómo navegar esta documentación

### Arquitectura

Consulta `architecture/` para entender cómo está construido el sistema.

Documentos vigentes:

- [`architecture/overview.md`](./architecture/overview.md): vista general vigente de la arquitectura.
- [`architecture/frontend-as-is.md`](./architecture/frontend-as-is.md): arquitectura frontend actual, incluyendo vertical slices, `shared/`, routing y límites automatizados.
- [`architecture/backend-as-is.md`](./architecture/backend-as-is.md): arquitectura backend actual, incluyendo módulos de Sprint 2 y la transición estructural del backend.
- `architecture/frontend-slice-rules.md`: reglas de organización y dependencias del frontend.
- `architecture/backend-layer-rules.md`: reglas arquitectónicas del backend.
- `architecture/adr-001-public-content-governance.md`: decisión arquitectónica existente.
- `architecture/adr-002-backend-capability-authorization.md`: decisión sobre autorización por capacidades.

Documentos históricos o de transición:

- `architecture/current-state.md`
- `architecture/gap-analysis.md`
- `architecture/erp-f0-stabilization.md`
- `architecture/sprint-1-scope.md`

Estos documentos no deben asumirse automáticamente como descripción del estado actual.

### Módulos

Documentos estables disponibles:

- [`modules/reservations.md`](./modules/reservations.md): disponibilidad, ciclo de vida, concurrencia e integración financiera de Reservas.
- [`modules/financial.md`](./modules/financial.md): cargos, pagos, movimientos, resumen e integración con Reservas.

Siguientes prioridades:

1. Afiliados
2. Auditoría
3. Donaciones

Cada documento de módulo debe distinguir entre funcionalidad implementada, trabajo en evolución y alcance planificado.

### Desarrollo

La guía para trabajar con el repositorio se consolidará bajo `development/` e incluirá:

- puesta en marcha local;
- Docker;
- variables de entorno;
- estrategia y comandos de pruebas;
- flujo de contribución.

Mientras se completa esa consolidación, utiliza `CONTRIBUTING.md`, `.env.example`, `compose.yaml` y los `package.json` de frontend y backend como referencias operativas.

### Proyecto

La documentación de sprints, roadmap y deuda técnica se consolidará bajo `project/` para separarla de la arquitectura del producto.

## Fuente de verdad

Cuando exista una contradicción entre documentos y código, la prioridad de evidencia es:

1. código actual de `main`;
2. pruebas automatizadas vigentes;
3. configuración real del repositorio;
4. documentación marcada como vigente;
5. documentos históricos.

## OpenSpec

`openspec/` queda fuera de la iniciativa documental actual. Su contenido no se elimina ni reorganiza en esta fase, pero tampoco se utiliza como fuente vigente sin contrastarlo primero con el código actual.

## Definition of Done documental

Un área puede considerarse documentada cuando:

- corresponde con el código actual de `main`;
- no contradice otros documentos vigentes;
- indica claramente si es vigente o histórica;
- usa nombres reales de módulos, rutas, estados y capacidades;
- evita duplicar información que pertenece a otro documento;
- puede ser entendida por una persona nueva sin depender de conversaciones externas.

## Estado de consolidación

| Área | Estado |
| --- | --- |
| README principal | 🟢 Actualizado en la base documental |
| Arquitectura general | 🟢 `architecture/overview.md` creado y vigente |
| Arquitectura frontend | 🟢 Snapshot histórico reemplazado por arquitectura vigente |
| Arquitectura backend | 🟢 Snapshot de Sprint 1 reemplazado por arquitectura vigente |
| Autorización | 🟢 Base existente |
| ADRs | 🟢 Base existente |
| Reservas | 🟢 Documento estable creado |
| Financiero | 🟢 Documento estable creado |
| Afiliados | 🟡 Evidencia existente, falta consolidación |
| Donaciones | 🔴 Pendiente documentación de estado real |
| Docker/desarrollo | 🟡 Falta guía consolidada |
| Testing | 🟡 Evidencia repartida |
| Sprint 1 | 🟢 Base existente |
| Sprint 2 | 🔴 Falta consolidación |
