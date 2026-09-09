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
- [`modules/affiliates.md`](./modules/affiliates.md): consulta, edición, estados, validaciones y auditoría de Afiliados.
- [`modules/audit.md`](./modules/audit.md): trazabilidad, sanitización y consulta administrativa de Auditoría.
- [`modules/donations.md`](./modules/donations.md): estado real de Donaciones, preparación existente y alcance todavía pendiente.

Cada documento de módulo distingue entre funcionalidad implementada, trabajo en evolución y alcance planificado.

### Desarrollo

Guías vigentes:

- [`development/getting-started.md`](./development/getting-started.md): puesta en marcha local con Docker o Node.
- [`development/docker.md`](./development/docker.md): servicios, dependencias, healthchecks, persistencia y comandos Docker.
- [`development/environment-variables.md`](./development/environment-variables.md): clasificación de variables, secretos y consumo por entorno.
- [`development/testing.md`](./development/testing.md): estrategia de testing, comandos y validación por tipo de cambio.

El flujo Git y las reglas de contribución continúan en [`../CONTRIBUTING.md`](../CONTRIBUTING.md).

### Proyecto

Documentos consolidados:

- [`project/sprint-2.md`](./project/sprint-2.md): resultado real de Sprint 2 por dominio, decisiones técnicas, integraciones y alcance pendiente.

La documentación histórica de Sprint 1 continúa en `architecture/sprint-1-scope.md` hasta una futura reorganización histórica.

## Fuente de verdad

Cuando exista una contradicción entre documentos y código, la prioridad de evidencia es:

1. código actual de `main`;
2. pruebas automatizadas vigentes;
3. configuración real del repositorio;
4. documentación marcada como vigente;
5. documentos históricos.

## OpenSpec

`openspec/` queda fuera de la iniciativa documental actual. Su contenido no se elimina ni reorganiza en esta fase, pero tampoco se utiliza como fuente vigente sin contrastarlo primero con el código actual.

## Deudas transversales visibles

La documentación vigente debe mostrar también las diferencias reales entre capas. Actualmente Afiliados y Auditoría presentan una autorización híbrida:

```text
Frontend: capabilities
Backend: RolesGuard + Administrador
```

Esta diferencia se considera deuda de reconciliación y no debe ocultarse como si la migración a capabilities estuviera terminada de extremo a extremo.

La configuración Docker oficial integrada en `main` es `compose.yaml`; un `docker-compose.dev.yml` no forma parte actualmente de la rama canónica.

Donaciones permanece planificado/no implementado aunque su documentación de estado actual ya esté consolidada. Que el área documental esté en verde significa que su situación real está explicada correctamente, no que la funcionalidad exista.

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
| Autorización | 🟢 Base existente; deuda híbrida documentada |
| ADRs | 🟢 Base existente |
| Reservas | 🟢 Documento estable creado |
| Financiero | 🟢 Documento estable creado |
| Afiliados | 🟢 Documento estable creado |
| Auditoría | 🟢 Documento estable creado |
| Donaciones | 🟢 Estado real documentado como planificado/no implementado |
| Docker/desarrollo | 🟢 Guías reproducibles consolidadas |
| Testing | 🟢 Estrategia y comandos consolidados |
| Sprint 1 | 🟢 Base existente |
| Sprint 2 | 🟢 Estado consolidado contra `main` |
