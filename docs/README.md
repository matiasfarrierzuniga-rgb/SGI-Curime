# Documentación de SGI-Curime

Estado: Vigente  
Última revisión: 2026-11
Fuente primaria: decisiones funcionales aprobadas, contratos vigentes, código y configuración de la rama de trabajo; `main` es referencia de promoción

## Propósito

Este directorio concentra la documentación técnica, funcional y operativa vigente de SGI-Curime.

La regla principal es simple: la documentación debe explicar el sistema aprobado e implementado en la rama de trabajo, distinguiendo funcionalidades recuperadas de certificación final pendiente. Los documentos históricos pueden conservarse como evidencia de evolución, pero deben estar claramente identificados para evitar confusión.

## Cómo navegar esta documentación

### Arquitectura

Consulta `architecture/` para entender cómo está construido el sistema.

Documentos vigentes:

- [`architecture/overview.md`](./architecture/overview.md): vista general vigente de la arquitectura.
- [`architecture/frontend-as-is.md`](./architecture/frontend-as-is.md): arquitectura frontend actual, incluyendo vertical slices, `shared/`, routing y límites automatizados.
- [`architecture/error-boundary-navigation.md`](./architecture/error-boundary-navigation.md): causa raíz y política de recuperación contextual ante errores de renderizado.
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
- [`modules/institutional-board.md`](./modules/institutional-board.md): períodos, nombramientos, historia y límites de Junta Directiva.
- [`contracts/account-lifecycle-v1.md`](./contracts/account-lifecycle-v1.md): ciclo operativo de cuenta comunitaria, identidad y límites ERP.
- [`modules/donations.md`](./modules/donations.md): estado real de Donaciones, preparación existente y alcance todavía pendiente.
- [`requirements/adi-dinadeco-source-mapping.md`](./requirements/adi-dinadeco-source-mapping.md): análisis de plantillas privadas ADI/DINADECO y mapeo de requisitos contra el sistema actual, sin implementación ni datos personales.

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

1. decisiones funcionales aprobadas y contratos operativos vigentes;
2. código y configuración actuales de la rama de trabajo;
3. pruebas automatizadas vigentes, con su estado de ejecución explícito;
4. documentación marcada como vigente;
5. OpenSpec y documentos históricos, con estado explícito.

## OpenSpec

`openspec/` conserva decisiones, cambios activos y evidencia histórica. No sustituye contratos implementados ni se usa como fuente autónoma; los artefactos activos se contrastan con decisiones aprobadas y código actual. La estabilización actual está en `stabilize-rbac-v2-3-access-and-legacy-reconciliation`; su matriz es evidencia de aceptación, no una segunda matriz de grants.

## Deudas transversales visibles

La documentación vigente debe mostrar diferencias reales entre capas y no declarar certificación sin evidencia. RBAC V2.3 mantiene como fuente ejecutable `backend/src/auth/domain/policies/canonical-role-grants.ts`; cargos, afiliación e identidad no son substitutos de permisos técnicos. Matrices anteriores que contradigan decisiones aprobadas son históricas o `SUPERSEDED`, sin eliminación de su evidencia.

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
| Autorización | 🟡 RBAC V2.3 consolidado documentalmente; certificación funcional final pendiente |
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
