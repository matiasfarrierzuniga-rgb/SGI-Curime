# Inventario de consumidores: perfil institucional

## Metadata

- **Baseline:** `origin/main` `dc2a2d84a91e2484b9959812ba80cd7f8db151ac`.
- **Estado inventariado:** post-PR #94; AS-IS. No describe implementación Target v1.
- **Propósito:** cerrar OpenSpec 1.3: localizar lectores/escritores de `InstitutionalProfile`, contrato DINADECO, rutas, capabilities, auditoría, consumidores frontend y FK de Junta antes de preflight 1.4.
- **Método:** consolidación de resúmenes read-only Atlas/Forge/Pixel; contraste read-only con fuentes listadas. Sin ejecutar tests, migraciones, scripts ni DB. Búsqueda de referencias en `backend/`, `frontend/` y `docs/`; revisión de rutas, contratos y tests relevantes.

### Áreas

| Área | Significado |
| --- | --- |
| P0 | Perfil institucional directo: persistencia, API, DTO y editor frontend. |
| D0 | Dependiente DINADECO: lectura institucional dentro del reporte y contrato/UI derivados. |
| B0 | Junta Directiva: FK, modelos, rutas y UI que dependen del singleton. |
| X0 | Transversal: wiring, capabilities, auditoría, router, navegación y seguridad. |
| T0 | Prueba: evidencia automatizada actual y límites de sus dobles/mocks. |
| O0 | Operacional/documental: documentación AS-IS, ausencias verificadas y superficies no relacionadas. |

Las áreas agrupan superficie funcional; no reemplazan clasificación obligatoria de cada consumidor.

## Inventario exhaustivo trazable

### Prisma, migraciones y FK

| Evidencia `file:line` | Símbolo | Área | Clasificación | Dirección | Riesgo | Adaptación Target v1 |
| --- | --- | --- | --- | --- | --- | --- |
| `backend/prisma/migrations/20260920120000_add_institutional_profile/migration.sql:1-25` | enum `InstitutionalOrganizationType`; tabla singleton `InstitutionalProfile` | P0 | DIRECT | writer histórico; raíz actual | Campos nullable, enum legado y tabla nombrada; un rename no reconcilia semántica/requiredness. | Conservar migración inmutable; preparación/cutover forward-only sobre misma autoridad verificada. |
| `backend/prisma/schema.prisma:153-171,812-815` | modelo `InstitutionalProfile`, relación `boardTerms`, enum | P0/B0 | DIRECT | lectura/escritura Prisma generada | `institutionalProfile` es API Prisma usada runtime; cambiar modelo rompe compilación y consumidores directos. | Migrar API generada, relación y adaptador solo tras preflight y capa de compatibilidad. |
| `backend/prisma/migrations/20260922120000_add_institutional_board/migration.sql:1-35` | `BoardPosition`, `BoardTerm`, `BoardAppointment`, FKs e índices | B0 | DIRECT | writer histórico/RI | FK apunta físicamente a `InstitutionalProfile`; tablas y filas no pueden recrearse ni rediseñarse. | DDL forward transaccional repunta FK; retener columna `institutionalProfileId` y Board* durante transición. |
| `backend/prisma/schema.prisma:173-202,817-825` | relaciones BoardTerm/BoardAppointment/Person e índices | B0 | DIRECT | lectura/escritura Prisma | Mapeo Prisma conserva FK y payload Board actual; cambio simple de root afecta relation field. | Relación canónica mapeada a columna transicional; preservar `BoardPosition` y contratos. |

### Backend runtime, rutas, auditoría, capabilities y wiring

| Evidencia `file:line` | Símbolo | Área | Clasificación | Dirección | Riesgo | Adaptación Target v1 |
| --- | --- | --- | --- | --- | --- | --- |
| `backend/src/institutional-profile/institutional-profile.service.ts:8-76` | `InstitutionalProfileService.get/getForReport/update` | P0 | COMPATIBILITY | lee/escribe `prisma.institutionalProfile` directo | Sin mapper explícito; `update(data: dto)` permite nulos y respuesta Prisma directa. | Un único adaptador contra autoridad canónica; proyectar request/response legado y rechazar borrar requeridos post-cutover. |
| `backend/src/institutional-profile/dto/update-institutional-profile.dto.ts:5-29` | `UpdateInstitutionalProfileDto` | P0 | DIRECT | entrada PATCH | Normaliza vacío a `null`; 13 campos nullable, enum legado y límites actuales. | Mantener nombres/límites de compatibilidad; endurecer requiredness solo tras reconciliación atestada. |
| `backend/src/institutional-profile/institutional-profile.controller.ts:9-22` | controller profile | P0/X0 | DIRECT | HTTP reader/writer | Ruta y capabilities consumidas por clientes existentes. | Preservar `GET/PATCH /institutional-profile` y capacidades. |
| `backend/src/financial/dinadeco-reports.service.ts:30-72,110-147` | `DinadecoReportsService.annual` | D0 | DIRECT | lector indirecto vía `getForReport(tx)` | Identidad institucional comparte snapshot `RepeatableRead` con cálculos; cambiar fuente/forma rompe reporte. | Leer autoridad canónica dentro mismo `RepeatableRead`; conservar `data.institutionalProfile`. |
| `backend/src/financial/dinadeco-reports.controller.ts:14-29` | annual DINADECO | D0/X0 | DIRECT | HTTP reader | Capability y forma externa actual deben permanecer. | Conservar `GET /financial/reports/dinadeco/annual?year=YYYY`, `fin.dinadeco.read`. |
| `backend/src/financial/financial.module.ts:3,10-19` | `FinancialModule` importa profile | D0/X0 | INDIRECT | module wiring | Inyección actual depende `InstitutionalProfileModule`. | Cambiar provider detrás de contrato sin rediseñar módulo financiero. |
| `backend/src/institutional-board/institutional-board.service.ts:9-92` | `InstitutionalBoardService` | B0 | DIRECT | filtra/crea con `institutionalProfileId = 1` | Cada listado, lookup, create y validación de cita presupone FK/identidad actual. | Conservar singleton `1`, filtros y payloads; repuntar solo RI/relación en cutover B0. |
| `backend/src/institutional-board/institutional-board.controller.ts:10-21` | controller Board | B0/X0 | DIRECT | HTTP readers/writers | Rutas actuales y separación read/manage son contrato. | Mantener rutas, `BoardPosition`, term/appointment payloads; no DB-4. |
| `backend/src/app.module.ts:27-28,55-56` | imports de Profile/Board | X0 | INDIRECT | module wiring | Ambos módulos son parte de bootstrap actual. | Conservar wiring; reemplazar internals bajo contratos existentes. |
| `backend/src/auth/presentation/capabilities/capability-policy.ts:18-21,48-68` | `CAPABILITIES`, `ROLE_CAPABILITIES` | X0 | INDIRECT | autorización | Administrador recibe profile/board; Tesorero recibe DINADECO. | Preservar exactamente las cinco capabilities y asignaciones. |
| `backend/src/audit/audit-actions.ts:66-70` | acciones profile/Board | X0 | DIRECT | taxonomía audit | Historial profile usa nombre legado; Board tiene secuencia separada. | Retener `INSTITUTIONAL_PROFILE_UPDATED`/`InstitutionalProfile`; futuro canónico único y lector combinado, sin renombrar Board*. |
| `backend/src/institutional-profile/institutional-profile.service.ts:62-73` | audit profile actual | P0/X0 | DIRECT | writer audit | Emite `INSTITUTIONAL_PROFILE_UPDATED`, módulo `ADMINISTRATIVE`, entidad `InstitutionalProfile`. | Conservar eventos históricos; posterior cutover emite solo evento canónico saneado. |
| `backend/src/institutional-board/institutional-board.service.ts:27-29,48-50,59-61,73-75,92` | audit Board | B0/X0 | DIRECT | writer audit | Board usa `BOARD_TERM_*`/`BOARD_APPOINTMENT_*`; no pertenece a generación Profile. | Mantener sin cambio; no combinarlo con Profile. |
| `backend/src/audit/audit.service.ts:58-92`; `backend/src/audit/audit.controller.ts:13-23` | `AuditService.findAll`, `/audit-logs` | X0 | INDIRECT | lector audit genérico | Filtra una acción/módulo por query; no une generaciones Profile. | Añadir compatibilidad de lectura explícita en tarea 7.5 antes de evento canónico. |

### Frontend: API, tipos, hooks, formulario, páginas, rutas, navegación y seguridad

| Evidencia `file:line` | Símbolo | Área | Clasificación | Dirección | Riesgo | Adaptación Target v1 |
| --- | --- | --- | --- | --- | --- | --- |
| `frontend/src/features/institutional-profile/api/institutionalProfile.api.ts:4-7` | `institutionalProfileApi` | P0 | DIRECT | GET/PATCH API | Literales HTTP y tipo response actuales. | Mantener endpoint y payload legado mediante mapper backend. |
| `frontend/src/features/institutional-profile/model/institutionalProfile.types.ts:1-22` | `InstitutionalProfile`, `UpdateInstitutionalProfileInput` | P0 | COMPATIBILITY | contrato frontend | 13 campos legado, enum y timestamps son contrato de editor. | Conservar tipo/shape público mientras internals se canonicalizan. |
| `frontend/src/features/institutional-profile/hooks/institutionalProfile.queries.ts:4-9` | query key y mutations | P0 | DIRECT | lector/escritor frontend | Cache `institutional-profile` depende response actual. | Mantener key/contrato; invalidación no requiere cambio si API es compatible. |
| `frontend/src/features/institutional-profile/ui/InstitutionalProfilePage.tsx:15-34,63-93` | formulario profile | P0 | DIRECT | writer frontend | Formulario trata 13 campos como opcionales y convierte vacío a `null`. | Actualizar validación/copy para requiredness canónica sin cambiar nombres/ruta; conservar `locality` transicional. |
| `frontend/src/features/financial/api/financial.api.ts:16-25`; `frontend/src/features/financial/hooks/useFinancial.ts:6-27` | API/hook annual DINADECO | D0 | DIRECT | lector frontend | Ruta y cache key dependen contrato report. | Conservar endpoint, query y `data.institutionalProfile`. |
| `frontend/src/features/financial/model/financial.types.ts:81-131` | `DinadecoInstitutionalProfile`, `DinadecoAnnualReport` | D0 | COMPATIBILITY | contrato frontend | D0 expone mismos 13 campos, enum y `locality`; no id/FK. | Mantener shape externo; fuente canónica detrás de proyección. |
| `frontend/src/features/financial/ui/DinadecoAnnualReportPage.tsx:20-25,73,122-167` | página/tarjeta DINADECO | D0/X0 | DIRECT | lector UI/enlace profile | Renderiza 13 campos, enum y link administrativo protegido por capability. | Preservar presentación, fallback null y enlace; no rediseño financiero. |
| `frontend/src/features/institutional-board/api/institutionalBoard.api.ts:5-10`; `frontend/src/features/institutional-board/hooks/institutionalBoard.queries.ts:3-10` | API/hooks Board | B0 | DIRECT | lectores/escritores frontend | Endpoints, keys y mutaciones son consumidores de Board payload. | Sin cambio de rutas/payloads; FK sigue opaca al frontend. |
| `frontend/src/features/institutional-board/model/institutionalBoard.types.ts:1-7`; `frontend/src/features/institutional-board/ui/InstitutionalBoardPage.tsx:14-38` | Board types/UI | B0 | DIRECT | consumidor Board | Posiciones/term/appointment actuales deben sobrevivir; no expone profile FK. | Retener modelos y UI; no Governance*. |
| `frontend/src/app/router/AppRoutes.tsx:84-111` | rutas DINADECO/profile/Board | X0 | INDIRECT | route guards | Literales route/capability son dependencias de deep links. | Preservar las tres rutas y guards actuales. |
| `frontend/src/app/navigation/erpNavigation.ts:114-123,181-184` | navegación ERP | X0 | INDIRECT | navegación | Rutas/capabilities aparecen en menú. | Mantener literals y visibilidad por capability. |
| `frontend/src/shared/security/access.ts:12-45,50-94` | policy frontend | X0 | INDIRECT | seguridad UX | Duplicación deliberada de capabilities backend; no es enforcement autoritativo. | Mantener paridad: Admin todo profile/board; Tesorero DINADECO. |

### Tests existentes

| Evidencia `file:line` | Símbolo | Área | Clasificación | Dirección | Riesgo | Adaptación Target v1 |
| --- | --- | --- | --- | --- | --- | --- |
| `backend/src/institutional-profile/institutional-profile.service.spec.ts:25-165`; `backend/src/institutional-profile/institutional-profile.controller.spec.ts:7-22`; `backend/src/institutional-profile/dto/update-institutional-profile.dto.spec.ts:1` | unit profile | T0/P0 | TEST_ONLY | mocks inline | Cubren singleton, select report-safe, audit, nulos, guards/DTO; no PostgreSQL ni mapper canónico. | Añadir pruebas compatibilidad/mapeo/requeridos posteriores. |
| `backend/test/institutional-profile.e2e-spec.ts:12-64` | e2e profile con Prisma mock | T0/P0 | TEST_ONLY | HTTP con doubles | Cubre 401/403/200/400 y audit; no toca DB real. | Ampliar compatibilidad y rechazo de requiredness. |
| `backend/src/financial/dinadeco-reports.service.spec.ts:12-430`; `backend/src/financial/dinadeco-reports.controller.spec.ts:7-36`; `backend/test/dinadeco-reports.e2e-spec.ts:17-253` | unit/controller/e2e DINADECO | T0/D0 | TEST_ONLY | mocks inline | Cubre snapshot, 13 campos/nulls, capability y shape; e2e no usa PostgreSQL. | Regresión before/after fuente canónica y mismo snapshot. |
| `backend/src/institutional-board/institutional-board.service.spec.ts:4-48`; `backend/src/institutional-board/institutional-board.controller.spec.ts:3-7` | unit Board | T0/B0 | TEST_ONLY | mocks inline | Cubre `institutionalProfileId: 1`, reglas y capabilities; no FK/cutover en DB. | Añadir migración/integración para fingerprints, FK y filas Board*. |
| `frontend/src/features/institutional-profile/ui/InstitutionalProfilePage.test.tsx:6-67` | UI profile | T0/P0 | TEST_ONLY | hooks mock | Cubre nulos, normalización, estados; no API/hook directo. | Añadir flujo con requiredness compatible. |
| `frontend/src/features/financial/ui/DinadecoAnnualReportPage.test.tsx:13-203` | UI DINADECO | T0/D0 | TEST_ONLY | `httpClient` mock | Cubre 13 campos/nulls/enlace y capability UX; no contrato backend real. | Mantener regression del shape y enlace durante cutover. |
| `frontend/src/features/institutional-board/ui/InstitutionalBoardPage.test.tsx:5-48`; `frontend/src/features/institutional-board/model/institutionalBoard.types.test.ts:1` | UI/types Board | T0/B0 | TEST_ONLY | hooks mock | Cubre term/appointment UI; no API/hook directo ni e2e Board. | Añadir API/integración/e2e enfocado al cutover. |
| `frontend/src/app/router/AppRoutes.test.tsx:54-64,365-375`; `frontend/src/app/navigation/erpNavigation.test.ts:86-92,132`; `frontend/src/shared/security/access.test.ts:8-94` | routes/nav/security | T0/X0 | TEST_ONLY | mocks/literales | Cubre mocks de profile/DINADECO, rutas y asignación roles; Board no tiene mock HTTP directo. | Preservar regresiones de literals/capabilities. |

### Documentación operativa, ausencias y no relacionados

| Evidencia `file:line` | Símbolo | Área | Clasificación | Dirección | Riesgo | Adaptación Target v1 |
| --- | --- | --- | --- | --- | --- | --- |
| `docs/modules/institutional-profile.md:5-36` | módulo profile AS-IS | O0 | DOCUMENTATION_ONLY | documentación operativa | Declara `InstitutionalProfile` canónico actual y campos nullable. | Actualizar solo en bloque documental 8.x, no durante 1.3. |
| `docs/modules/institutional-board.md:3-17` | módulo Board AS-IS | O0 | DOCUMENTATION_ONLY | documentación operativa | Declara vínculo BoardTerm→InstitutionalProfile y límites DB-4. | Registrar Board* como transicional tras cutover; no rediseñar. |
| `docs/modules/financial.md:217-258`; `docs/requirements/adi-dinadeco-source-mapping.md:234-265,400-420` | DINADECO/ADI AS-IS | O0 | DOCUMENTATION_ONLY | documentación operativa | Nombran fuente legacy y contrato D0. | Actualizar Current/AS-IS en 8.x; preservar Target v1 congelado. |
| Búsqueda read-only en `backend/prisma`, `backend/src`, `backend/test`, `frontend/src` | migración PostgreSQL, seeds/fixtures/scripts Profile/Board, API/hook direct tests, e2e Board | O0 | UNRELATED | ausencia relevante | No hay tests migración/PostgreSQL, seeds Profile/Board, scripts runtime Profile/Board, tests directos API/hooks Profile/Board ni e2e Board. | Crear evidencia enfocada en tareas 2.5, 3.8, 4.6, 5.5 y 6.5; no usar seeds/datos institucionales tracked. |
| Búsqueda read-only en `backend/`, `frontend/`, `docs/` | DB-2, DB-4/Governance*, rutas/consumidores no listados | O0 | UNRELATED | fuera de alcance | No hay consumidor institucional independiente adicional hallado; Board es única dependencia FK. | No iniciar DB-2/DB-4; re-ejecutar inventario antes de retiro 10.1. |

## Contratos actuales explícitos

### HTTP

| Método | Ruta | Capability | Consumidor/nota |
| --- | --- | --- | --- |
| GET | `/institutional-profile` | `adm.institutional-profile.read` | Perfil P0. |
| PATCH | `/institutional-profile` | `adm.institutional-profile.update` | Perfil P0; DTO nullable actual. |
| GET | `/financial/reports/dinadeco/annual?year=YYYY` | `fin.dinadeco.read` | D0; conserva `data.institutionalProfile`. |
| GET | `/institutional-board/terms` | `adm.institutional-board.read` | B0. |
| GET | `/institutional-board/terms/:id` | `adm.institutional-board.read` | B0. |
| GET | `/institutional-board/person-candidates` | `adm.institutional-board.read` | B0. |
| POST | `/institutional-board/terms` | `adm.institutional-board.manage` | B0. |
| PATCH | `/institutional-board/terms/:id` | `adm.institutional-board.manage` | B0. |
| POST | `/institutional-board/terms/:termId/appointments` | `adm.institutional-board.manage` | B0. |
| PATCH | `/institutional-board/appointments/:id` | `adm.institutional-board.manage` | B0. |

Capabilities que deben permanecer: `adm.institutional-profile.read`, `adm.institutional-profile.update`, `adm.institutional-board.read`, `adm.institutional-board.manage`, `fin.dinadeco.read`. Administrador posee profile y Board; Administrador y Tesorero poseen DINADECO.

### Auditoría actual

- Profile actual: acción `INSTITUTIONAL_PROFILE_UPDATED`, entidad `InstitutionalProfile`, módulo `ADMINISTRATIVE`, `entityId = 1`, `details.changedFields`.
- Board actual: `BOARD_TERM_CREATED`, `BOARD_TERM_UPDATED`, `BOARD_APPOINTMENT_CREATED`, `BOARD_APPOINTMENT_UPDATED`; entidades `BoardTerm`/`BoardAppointment` y módulo `INSTITUTIONAL_BOARD`.
- Lector: `AuditService.findAll` filtra por una acción/módulo; todavía no combina generaciones legacy/canónica.

### Board: RI actual

- `BoardTerm.institutionalProfileId` es `NOT NULL`, referencia `InstitutionalProfile(id)`, `ON DELETE RESTRICT`, `ON UPDATE CASCADE`.
- `BoardTerm`: PK, `CHECK (startsOn <= endsOn)`, índice `(institutionalProfileId, startsOn)`.
- `BoardAppointment`: FK `boardTermId → BoardTerm` y `personId → Person`, ambas `RESTRICT/CASCADE`; PK; checks `seatNumber > 0` cuando existe y rango de fechas; índices `boardTermId`, `personId`, `(position, seatNumber)`.
- Los contratos B0 frontend no exponen `institutionalProfileId`; preservan term, appointment, person y `BoardPosition`.

### Contratos frontend P0/D0/B0

- **P0:** API GET/PATCH, tipo `InstitutionalProfile`, cache key `['institutional-profile']`, formulario con 13 campos legacy: `legalName`, `legalIdentification`, `dinadecoRegistrationCode`, `dinadecoRegion`, `organizationType`, `province`, `canton`, `district`, `locality`, `correspondenceAddress`, `phone`, `telefax`, `email`. El formulario convierte vacío a `null`.
- **D0:** `data.institutionalProfile` expone los mismos 13 campos, sin `id`, timestamps ni FK; UI renderiza enum/locality y muestra nulos como pendiente.
- **B0:** API/hook/types/UI no exponen FK profile; conservan rutas Board, `BoardPosition`, term/appointment y Person candidate payloads.

## Riesgos que impiden rename simple de Prisma

1. Persistencia actual nullable y enum `INTEGRAL/SPECIFIC`; Target exige valores canónicos atestados y semántica distinta para región, dirección, tipo y contactos.
2. P0 retorna Prisma directo y acepta `null`; renombrar modelo rompe generated client, API y formulario antes de mapper explícito.
3. D0 debe mantener los 13 campos bajo `data.institutionalProfile` y el snapshot `RepeatableRead`; cambiar nombre/fuente sin proyección altera contrato y consistencia.
4. `BoardTerm.institutionalProfileId` tiene FK física, constraints e índices; su columna, datos y `BoardAppointment`/`Person` deben preservarse transaccionalmente.
5. Rutas, guards, navegación, capabilities y tests dependen literals actuales; route rename no aporta convergencia física.
6. Historial audit legacy no puede renombrarse; lector actual no combina eventos legacy/canónicos.
7. No hay tests PostgreSQL/migración ni e2e Board para demostrar rename/FK/cutover seguro.

## Contradicciones nuevas

- **Documental/operativa:** `docs/requirements/adi-dinadeco-source-mapping.md:5` declara baseline PR #87, pero el mismo documento contiene evidencia Board post-PR #94, por ejemplo `BoardTerm`/`BoardAppointment` en líneas 157-170 y 400-420. Su baseline documental quedó desfasado respecto del AS-IS inventariado.
- **Aclaración:** Target v1 frente a AS-IS post-PR #94 es transición intencional definida por este OpenSpec; no es contradicción. Este inventario no modifica Target ni documentación operativa.

No se hallaron otras contradicciones nuevas en evidencia revisada.

## Conclusión de completitud

Cobertura 1.3 completa: migraciones/Prisma/FK; readers/writer Profile; contrato y snapshot DINADECO; rutas Profile/Board/DINADECO; capabilities y wiring; auditoría Profile/Board y lector; consumidores frontend P0/D0/B0, rutas, navegación y seguridad; tests/mocks; documentación operativa; ausencias relevantes y exclusiones DB-2/DB-4.

Pendiente exclusivamente fuera de 1.3: **1.4**, preflight read-only con las seis clasificaciones de estado sin registrar valores institucionales.
