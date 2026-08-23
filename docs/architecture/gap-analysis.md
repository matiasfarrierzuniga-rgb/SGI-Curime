# Análisis de brechas arquitectónicas

> **Historical architecture snapshot.** Captured at commit/date: 5efd424,
> 2026-08-14. **Not the current frontend source of truth.** Use
> [frontend-as-is.md](./frontend-as-is.md) for current frontend state.

## Objetivo

Este documento compara el estado verificado en [current-state.md](./current-state.md) con la arquitectura objetivo del Plan de ejecución para SGI-Curime. No convierte propuestas en decisiones ni corrige brechas durante la Fase 0.

## Fuente del estado objetivo

La fuente de verdad objetivo es el texto completo titulado `Plan de ejecución para SGI-Curime`, suministrado directamente por el usuario al iniciar el cambio OpenSpec `establish-phase-0-baseline` el 14 de agosto de 2026. El plan define el stack objetivo, las reglas no negociables, las fases 0 a 7, CI/CD, documentación, criterios de adopción de Redis/RabbitMQ y la Definition of Done global. No se encontró una copia de ese documento dentro del repositorio; por ello, las asignaciones de fase de esta comparación se remiten a la solicitud que autorizó el cambio y no se presentan como evidencia del estado actual.

## Clasificación

| Estado | Significado |
| --- | --- |
| Alineado | El repositorio refleja la decisión objetivo, sujeto a las validaciones indicadas. |
| Parcial | Existe una base, pero faltan capacidades o verificaciones relevantes. |
| Ausente | No se encontró la capacidad objetivo. |
| No verificado | Existe configuración o código, pero no se comprobó su ejecución. |

Prioridad de riesgo:

| Prioridad | Criterio |
| --- | --- |
| Crítica | Bloquea integración segura o reproducibilidad básica. |
| Alta | Puede causar regresiones, exposición de seguridad o divergencia arquitectónica. |
| Media | Deuda que reduce mantenibilidad, calidad u operación. |
| Baja | Mejora documental o de consistencia sin bloqueo inmediato. |

## Matriz de brechas

| Área objetivo | Estado actual y evidencia | Estado | Brecha e impacto | Fase responsable |
| --- | --- | --- | --- | --- |
| React + TypeScript + Vite | Declarados en `frontend/package.json`; fuente de plantilla en `frontend/src`. | Parcial | Existe base técnica, pero no aplicación de negocio ni integración. | Fase 2 |
| Vertical Slices frontend | No existe `features/`, API pública por `index.ts` ni estructura objetivo. | Ausente | No hay límites frontend ni slices de negocio. | Fases 2 y 5 |
| TanStack Router | Dependencia y routing ausentes. | Ausente | No existen rutas públicas, protegidas, 401/403 o 404. | Fase 2 |
| TanStack Query | Dependencia y cliente ausentes. | Ausente | No hay administración de estado remoto. | Fases 2 y 5 |
| TanStack Form | Dependencia y formularios de aplicación ausentes. | Ausente | No hay patrón de formularios objetivo. | Fases 2, 4 y 5 |
| TanStack Table | Dependencia y tablas ausentes. | Ausente | No hay patrón de tablas objetivo. | Fases 2 y 5 |
| Tailwind CSS y shadcn/ui | No declarados ni configurados. | Ausente | Falta la fundación visual y de componentes. | Fases 2 y 3 |
| Configuración frontend centralizada | No hay `import.meta.env`, `shared/config` ni `AppConfig`. | Ausente | La integración futura carece de contrato de configuración. | Fase 2 |
| Cliente HTTP normalizado | No hay llamadas HTTP ni cliente compartido. | Ausente | No se manejan credenciales, errores, cancelación o request ID. | Fase 2 |
| NestJS como monolito modular | `AppModule` compone módulos de auth, usuarios, solicitudes, auditoría y Prisma. | Parcial | La base coincide; faltan documentación y pruebas de límites. No se justifica reescritura. | Fases 1 y 6 |
| Reglas de negocio en backend | Servicios contienen revisión de solicitudes, usuarios, roles y último administrador. | Alineado | Debe preservarse al integrar el frontend. | Continuo |
| PostgreSQL oficial | Prisma y Compose usan PostgreSQL. | Alineado | La ejecución real de migraciones no está verificada. | Fases 6 y 7 |
| Prisma responsable de migraciones | Cuatro migraciones rastreadas y `prisma.config.ts`. | Parcial | Falta ciclo reproducible de generate, migrate y validación. | Fases 6 y 7 |
| API REST versionada `/api/v1` | Existen 22 rutas sin prefijo global ni versionado. | Parcial | El contrato actual no coincide con las rutas objetivo. | Fases 4 y 6 |
| OpenAPI como contrato | Swagger/OpenAPI, JSON y cliente generado ausentes. | Ausente | Frontend y backend pueden divergir sin detección automática. | Fase 6 |
| Autenticación controlada por NestJS | Login, JWT, guards y consulta de usuario/rol en backend. | Alineado | La autoridad está en backend, pero la entrega del token no cumple el objetivo. | Fase 4 |
| Cookies `HttpOnly` | JWT devuelto en JSON y consumido como Bearer. | Ausente | Riesgo de almacenamiento inseguro en un cliente futuro y contrato incompatible con la meta. | Fase 4 |
| `Secure`, `SameSite` y CSRF | Sin cookies ni controles CSRF. | Ausente | Debe diseñarse junto con topología, origen y CORS. | Fases 1 y 4 |
| Refresh rotatorio y revocación | No hay refresh, sesiones, logout ni invalidación global. | Ausente | No existe continuidad o revocación segura de sesión. | Fase 4 |
| Rate limiting | Solo existe bloqueo por cuenta. | Parcial | Falta protección general de endpoints sensibles. | Fase 4 |
| Roles y permisos | Roles y guard por nombre; no existe modelo de permisos. | Parcial | `session` no puede devolver permisos granulares actualmente. | Fases 1 y 4 |
| Auditoría | Módulo, modelo, endpoints y saneamiento presentes. | Parcial | Falta probar persistencia real y cubrir eventos de sesión futura. | Fases 4, 5 y 6 |
| Solicitudes de usuario | Backend implementado y probado con mocks. | Parcial | Falta slice frontend, contrato OpenAPI y prueba con PostgreSQL real. | Fases 5 y 6 |
| Usuarios | Backend administrativo implementado. | Parcial | Falta slice frontend, permisos y pruebas integradas. | Fases 5 y 6 |
| Administración | Funciones distribuidas entre usuarios, solicitudes y auditoría. | Parcial | Falta slice frontend y contrato formal. | Fase 5 |
| Dashboard | No se encontró implementación. | Ausente | Capacidad planificada pendiente. | Fase 5 |
| Pruebas frontend | No hay framework, scripts ni archivos. | Ausente | Cambios visuales y de integración no tendrán red de seguridad. | Fases 2 a 6 |
| Integración PostgreSQL real | HTTP tests usan principalmente mocks; suite completa solo prueba `/`. | Ausente | Riesgo de fallos entre Prisma, migraciones y servicios no detectados. | Fases 4 y 6 |
| Pruebas de arquitectura | No existen. | Ausente | No se verifican límites de módulos o features. | Fase 6 |
| Docker frontend/backend/postgres | Compose contiene únicamente PostgreSQL y no hay Dockerfiles. | Parcial | No existe entorno full-stack reproducible. | Fase 7 |
| Health checks y operación | No hay health checks ni endpoint dedicado. | Ausente | Compose no puede coordinar disponibilidad real. | Fases 2 y 7 |
| Variables por entorno | Solo `backend/.env.example`, incompleto para `PORT` y sin frontend. | Parcial | Configuración de desarrollo, prueba y producción no está formalizada. | Fases 2 y 7 |
| CI/CD | No existe pipeline rastreado; controles externos de GitHub u organización son desconocidos. | Ausente | El repositorio no define validación de builds, pruebas, migraciones o contratos en PR. | CI/CD posterior a Fase 7 |
| ADR | No existen ADR. | Ausente | Las decisiones objetivo aún no están formalizadas. | Fase 1 |
| Redis fuera de Sprint 1 | No es dependencia ni servicio. | Alineado | Mantener diferido hasta disponer de métricas y ADR. | Capacidad evolutiva |
| RabbitMQ fuera de Sprint 1 | No es dependencia ni servicio. | Alineado | Mantener diferido hasta disponer de necesidad asíncrona medible y ADR. | Capacidad evolutiva |

## Riesgos priorizados

### Críticos

1. **No existe integración frontend-backend.** React no consume el API real y el frontend rastreado no representa el producto.
2. **La sesión objetivo no existe.** El token Bearer actual no cubre cookies `HttpOnly`, refresh, revocación, logout, CSRF ni concurrencia de refresh.
3. **No existe contrato OpenAPI.** Los cambios de rutas, DTOs y respuestas no pueden comprobarse automáticamente entre backend y frontend.
4. **La reproducibilidad de un checkout limpio no está verificada.** Hay lockfiles, pero faltan dependencias locales y el cliente Prisma generado, y no existe un hook documentado de generación.

### Altos

1. **Pruebas de persistencia insuficientes.** La mayoría de pruebas HTTP reemplaza Prisma o los servicios.
2. **No hay CI definida en el repositorio.** La existencia de controles externos sobre Pull Requests es desconocida.
3. **Docker no cubre aplicaciones.** Solo PostgreSQL está definido y la configuración no pudo ejecutarse.
4. **Entrega de activación y recuperación vacía.** Los flujos generan tokens, pero no los entregan mediante un proveedor real.
5. **Autorización limitada a roles.** No hay permisos granulares para el contrato objetivo de sesión.

### Medios

1. El lint backend modifica archivos por defecto y no existe `format:check`.
2. No hay scripts independientes de typecheck.
3. La configuración de entorno no está centralizada ni validada en un único límite.
4. No existe prefijo o versionado del API.
5. `reviewedById` no tiene integridad referencial en dos modelos.
6. Correos únicos dependen de normalización de aplicación y no de una estrategia explícita case-insensitive en base de datos.
7. No se documenta una versión soportada de Node/npm.

### Bajos

1. Los README de frontend y backend conservan contenido de plantillas.
2. Hay contradicción entre la licencia `UNLICENSED` del backend y la mención MIT de su README.
3. El HTML frontend conserva idioma y título de plantilla.

## Funcionalidades existentes que deben preservarse

- Creación y revisión administrativa de solicitudes de usuario.
- Activación de cuentas con tokens almacenados como hash.
- Login JWT y validación de usuario/rol en base de datos por petición.
- Bloqueo temporal y desbloqueo administrativo.
- Recuperación y cambio de contraseña.
- Administración de usuarios y roles.
- Protección del último administrador activo.
- Registro y consulta de auditoría con saneamiento de datos sensibles.
- Persistencia PostgreSQL mediante Prisma y migraciones rastreadas.

Estas capacidades justifican evolución incremental y pruebas de regresión, no reescritura masiva del backend.

## Funcionalidades faltantes relevantes

- Aplicación frontend de negocio y consumo del API.
- Rutas públicas y protegidas.
- Sistema de diseño institucional.
- Sesión segura completa con cookies.
- Permisos granulares.
- OpenAPI y cliente generado.
- Vertical Slices para autenticación, solicitudes, usuarios, administración, auditoría y dashboard.
- Pruebas frontend, de arquitectura, contrato y persistencia real.
- Docker full-stack y documentación operativa.
- CI/CD.

Los modelos `Affiliate` y `AffiliateRequest` existen, pero no se encontraron servicios o endpoints; no se infieren requisitos adicionales para ellos en esta fase.

## Decisiones reflejadas actualmente

Las siguientes decisiones tienen evidencia en el código, aunque aún deben formalizarse mediante ADR cuando corresponda:

- Código backend definido como una única aplicación NestJS con módulos internos; la topología de despliegue real es desconocida.
- PostgreSQL como base de datos.
- Prisma como ORM y responsable de migraciones.
- REST como estilo actual de API.
- Backend como autoridad de autenticación y autorización.
- Hashing seguro de contraseñas y tokens temporales.
- Redis y RabbitMQ fuera de la operación inicial.

La existencia de código no equivale a aprobación formal del ADR. Los ADR de la Fase 1 deberán marcarse `Proposed` cuando el proyecto no haya confirmado explícitamente la decisión.

## Decisiones pendientes de formalización

- Límites y reglas del monolito modular.
- Estructura exacta y reglas de dependencia de Vertical Slices.
- Estrategia de OpenAPI, generación y control de compatibilidad.
- Migración desde Bearer JWT hacia cookies, incluyendo compatibilidad del contrato actual.
- Topología de dominios, CORS, atributos de cookie y protección CSRF.
- Persistencia, expiración, rotación, revocación y auditoría de sesiones.
- Modelo de permisos y relación con los roles existentes.
- Ciclo reproducible de Prisma generate, migrate y seed.
- Versión soportada de Node/npm y organización de paquetes.
- Proveedor de entrega para activación y recuperación.
- Proveedor y estructura de CI/CD.

No se introduce una `PROPUESTA` arquitectónica adicional en esta Fase 0. Las decisiones anteriores se mantienen pendientes para las fases previstas y no se presentan como resueltas.

## Deuda técnica

| Deuda | Evidencia | Consecuencia |
| --- | --- | --- |
| Cliente Prisma generado ausente y sin hook | `backend/generated/prisma` ignorado; scripts incompletos | Un checkout limpio puede no compilar. |
| Dependencias locales ausentes | `npm ls --depth=0` falla en ambos proyectos | No se pudo comprobar build o pruebas. |
| Tests HTTP con mocks extensivos | Overrides en suites de auth, users, requests y audit | Integración real con PostgreSQL no está protegida. |
| Configuración distribuida | Lecturas directas de `process.env` en varios servicios | Fallos de configuración pueden aparecer tarde o de forma inconsistente. |
| Respuestas sin contrato formal | Sin OpenAPI y con proyecciones manuales | Riesgo de divergencia y exposición accidental. |
| Compose con credenciales escritas | `compose.yaml` | Mala separación de configuración, incluso para desarrollo. |
| Servicios de entrega vacíos | Delivery services de activación y reset | Flujos incompletos fuera de pruebas o acceso directo a datos. |

## Dependencias evolutivas diferidas

### Redis

Se mantiene fuera del Sprint 1. Solo debe reconsiderarse con evidencia de múltiples instancias, rate limiting distribuido, consultas costosas, sesiones distribuidas o necesidad demostrada de caché. Requiere métricas, ADR y aprobación.

### RabbitMQ

Se mantiene fuera del Sprint 1. Solo debe reconsiderarse ante procesos largos, reintentos de notificaciones, generación asíncrona, procesamiento documental, integraciones externas o necesidad de workers. Requiere métricas, ADR y aprobación.

## Definition of Done de la Fase 0

- [x] Rama, commit, remotes y estado de Git registrados.
- [x] Estructura, gestores de paquetes, versiones y scripts inventariados.
- [x] Frontend auditado sin atribuir capacidades al `dist/` ignorado.
- [x] Backend, módulos, rutas, DTOs, guards y servicios auditados.
- [x] Autenticación y autorización auditadas.
- [x] Prisma, migraciones, modelos y PostgreSQL auditados.
- [x] Docker, Compose y variables de entorno auditados.
- [x] Pruebas existentes clasificadas por nivel real de integración.
- [x] Validaciones seguras intentadas y bloqueos registrados.
- [x] `docs/architecture/current-state.md` creado con evidencia y desconocidos.
- [x] `docs/architecture/gap-analysis.md` creado contra la arquitectura objetivo.
- [x] Riesgos, deuda, capacidades existentes y faltantes documentados.
- [x] Decisiones implementadas y pendientes separadas.
- [x] Redis y RabbitMQ confirmados fuera de la etapa inicial.
- [x] No se modificó código, configuración de runtime, migraciones o infraestructura.
- [ ] Build frontend validado; bloqueado por dependencias ausentes y por generar artefactos fuera del alcance documental.
- [ ] Build backend validado; bloqueado por dependencias y cliente Prisma ausentes.
- [ ] Pruebas backend validadas; bloqueadas por dependencias ausentes y, para integración completa, porque no se dispuso de una base PostgreSQL configurada y validada para la auditoría.
- [ ] Docker Compose validado en ejecución; bloqueado porque Docker no está disponible.

## Resultado de la comparación

La Fase 0 queda documentalmente completa con observaciones de validación. El orden del plan sigue siendo adecuado: formalizar decisiones antes de construir la fundación frontend y resolver la sesión segura antes de multiplicar pantallas protegidas. No debe iniciarse la Fase 1 sin aprobación explícita de esta línea base.
