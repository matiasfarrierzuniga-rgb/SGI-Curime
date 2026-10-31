# Tasks

## 1. PBI UI-STD-01 — Baseline y contrato reusable

- [ ] 1.1 Congelar inventario de 24 tablas, 67 archivos de superficie administrativa/internal y conteos de controles documentados en `design.md`; verificar que el baseline se pueda repetir con búsqueda estática sin modificar código.
- [ ] 1.2 Convertir requisitos de `design-system/ui-consistency` en matriz de aceptación para controles, filtros, tablas, estados, badges, iconos y paginación; verificar cada requisito contra un escenario testeable.
- [ ] 1.3 Extender solo primitives compartidas necesarias en `frontend/src/shared/ui/` sin crear componentes de dominio; verificar imports respetan `app -> features -> shared` mediante `npm run check:architecture`.
- [ ] 1.4 Añadir pruebas focalizadas de `Input`, `Select`, `Textarea`, `FormField`, `Button`, `StatusBadge`, `Pagination` y composición de tabla para foco, disabled, invalid, loading, labels, teclado y objetivos táctiles; verificar con Vitest focalizado y axe donde aplique.
- [ ] 1.5 Registrar excepciones de tabla accesible financiera, reportes densos, avatar local y overflow en documentación del cambio; verificar que cada excepción tenga consumidor, razón y criterio de salida.
- [ ] 1.6 Definir vocabulario de acciones y mensajes para usuarios con poca familiaridad informática, manteniendo verbos consistentes entre botón, confirmación, busy, éxito, vacío y error; verificarlo contra la matriz UX de `design.md` sin agregar copy técnico.

## 2. PBI UI-STD-02 — P0 controles y filtros de Personas y solicitudes

- [x] 2.1 Migrar `features/users/ui/UserFilters.tsx` y superficies de filtros de usuarios al contrato común, conservando búsqueda, estado, rol, reset, submit y query state; verificar filtros y limpieza con pruebas existentes/focalizadas.
- [x] 2.2 Normalizar filtros de `features/affiliates/ui/AffiliateFilters.tsx` y campos de `EditAffiliateModal.tsx` sin cambiar validación, payload, capability ni cache invalidation; verificar asociación label/control, error, disabled y submit.
- [x] 2.3 Normalizar `features/affiliate-requests/ui/AffiliateRequestsFilters.tsx` y `AffiliateRequestDetail.tsx`, preservando aplicación diferida de correo, feedback, aprobación/rechazo y contrato de `affiliate-requests`; verificar escenarios de filtros, teclado, error y acción única.
- [x] 2.4 Normalizar filtro, textarea y acciones de `pages/admin/UserRequestsPage.tsx`, preservando revisión, rol, rechazo, loading, permisos y ruta `/admin/user-requests`; verificar que no haya request inválido ni doble submit.
- [ ] 2.5 Corregir composición de iconos de búsqueda, alturas, padding, radios, hover, focus-visible, disabled y loading en las cuatro superficies P0; verificar manualmente 320/375/768/1024/1440 px, navegación de teclado y comprensión de la acción sin tooltip.
- [ ] 2.6 Añadir o actualizar pruebas de regresión P0 para nombres accesibles, errores asociados, foco, estados vacíos/error/loading y rutas directas protegidas; verificar con Vitest focalizado y `git diff --check`.

## 3. PBI UI-STD-03 — P1 tablas y estados de Personas y solicitudes

- [x] 3.1 Alinear `features/users/ui/UsersTable.tsx` al contrato común usando `DataTable` como baseline, sin alterar menú de acciones, focus restoration, role/lifecycle actions ni capabilities; verificar acciones de fila y Escape con pruebas.
- [x] 3.2 Migrar `features/affiliates/ui/AffiliatesTable.tsx` a estructura de tabla equivalente al baseline, preservando campos, status y detalle; verificar encabezados, overflow, hover/focus-within y acción accesible.
- [x] 3.3 Migrar `features/affiliate-requests/ui/AffiliateRequestsTable.tsx` y la tabla de `UserRequestsPage.tsx`, manteniendo separados ambos workflows y sus contratos; verificar estado textual, acciones y paginación.
- [x] 3.4 Uniformar loading, empty, error, retry, status badge y pagination de las cuatro pantallas P0; verificar que ningún estado muestre datos obsoletos como actuales.
- [ ] 3.5 Ejecutar revisión manual P1 en desktop/tablet/mobile, incluyendo overflow horizontal y lectura por teclado; registrar hallazgos no bloqueantes como backlog separado, sin ampliar alcance.
- [ ] 3.6 Validar que cada tabla P0 permita a una persona nueva identificar contexto, estado, resultado y siguiente acción sin depender de hover, color o conocimiento de permisos; verificar con checklist de aceptación UX y evidencia de teclado.

## 4. PBI UI-STD-04 — P1 legacy inventory y finanzas

- [ ] 4.1 Inventariar clases y estados legacy de `pages/inventory/InventoryCategoriesPage.tsx`, `InventoryItemsPage.tsx`, `InventoryLoansPage.tsx`, `InventoryMovementsPage.tsx` y `InventoryReportsPage.tsx`; verificar que cada filtro/formulario/tabla tenga mapeo a primitive o excepción.
- [ ] 4.2 Migrar primero filtros y acciones de inventario desde `<input>`, `<select>`, `<textarea>`, `.filters`, `.card` y `.actions` a primitives compartidas, sin cambiar servicios ni payloads; verificar CRUD, validación y estados busy con pruebas focalizadas.
- [ ] 4.3 Migrar tablas/listados de inventario al contrato común respetando detalle, activación, movimientos, préstamos, reportes y responsive; verificar columnas, acciones, overflow y estados vacíos/error.
- [ ] 4.4 Alinear `FinancialDashboardPage`, `FinancialMovementsPage`, `FinancialPage`, `FinancialPaymentModal`, `FinancialMovementFormModal` y `DinadecoAnnualReportPage`; verificar capabilities `fin.*`, pagos condicionados, reportes y tabla auxiliar accesible.
- [ ] 4.5 Añadir pruebas focalizadas de formularios, filtros, pagos, estados financieros y tablas accesibles; verificar con comandos de frontend permitidos durante VERIFY y registrar resultados sin afirmar PASS no ejecutado.

## 5. PBI UI-STD-05 — P2 extensión a módulos restantes

- [ ] 5.1 Migrar patrones de filtros, tablas y badges en `AbsenceJustificationsPage`, `DonationsPage`, `VenturesPage`, `VenturesSummaryPage`, `EventsManagementPage` y `OpportunitiesPage`; verificar cada API, estado y acción conserva comportamiento.
- [ ] 5.2 Revisar `InstitutionalBoardPage` y formularios relacionados después de DS-F2, separando estandarización visual de reglas person-first, validación institucional y autorización; verificar que no se alteren reglas de dominio.
- [ ] 5.3 Evaluar `AffiliateJustificationsPage`, reportes y tabla auxiliar financiera como excepciones o migraciones posteriores; verificar decisión documentada por consumidor, no una migración automática.
- [ ] 5.4 Añadir pruebas de regresión de cada módulo P2 para labels, foco, estados, responsive y acciones principales; verificar que cada grupo incluya su evidencia antes de avanzar al siguiente.

## 6. PBI UI-STD-06 — P3 responsive, accesibilidad residual y cierre técnico

- [ ] 6.1 Ejecutar matriz manual 320/375/768/1024/1440 px sobre todos los lotes aplicados, incluyendo overflow, overlays, iconos, tablas, filtros y dialogs; verificar evidencia por módulo y excepción.
- [ ] 6.2 Ejecutar revisión de teclado y lector de pantalla para navegación, filtros, tablas, paginación, estados y acciones; verificar nombres accesibles, orden lógico, foco visible/no oculto, retorno de foco en overlays y ausencia de trampas de teclado.
- [ ] 6.3 Ejecutar contraste y estados hover/focus-visible/active/disabled/loading/error contra tokens DS-F1/DS-F2; verificar que no existan comunicaciones solo por color.
- [ ] 6.4 Ejecutar `npm run lint`, `npm run check:architecture`, pruebas frontend focalizadas, `npm run build` y luego `npm run verify` solo en workspace APPLY/VERIFY autorizado; registrar cada resultado como `PASSED`, `FAILED` o `NOT_VERIFIED` con evidencia.
- [ ] 6.5 Revisar diff final para confirmar ausencia de cambios backend, API, DB, rutas, permisos, ERP Shell, dependencias no aprobadas y archivos DS-F2 ajenos; verificar `git diff --check` y rollback por lote.

## Workflow follow-up

- Aplicar un lote por PR dedicada, con revisión antes de iniciar el siguiente lote.
- Mantener DS-F2, UserRequests V2 y demás modificaciones preexistentes fuera de cualquier limpieza o reversión.
- Ejecutar VERIFY únicamente después de autorización explícita para salir de Explore.
- Archivar solo cuando implementación y verificación estén completas y aprobadas; no hacer Archive en esta fase.

## Evidencia incremental

- **P0-A (controles y filtros):** `SearchFilterBar`, `FormField`, `Input`, `Select`, `Textarea` y `Button` aplicados a Usuarios, Afiliados, Solicitudes de cuenta y Solicitudes de afiliación. `SearchInput` usa regiones grid separadas para icono e input nativo; no depende de padding para evitar superposición.
- **P0-B (tablas y estados):** `UsersTable`, `AffiliatesTable`, `AffiliateRequestsTable` y tabla de `UserRequestsPage` usan `DataTable`. Se preservan `StatusBadge`, acciones existentes, overflow identificado y `Pagination` compartida.
- **Verificación automatizada:** Vitest focalizado para SearchFilterBar y las cuatro pantallas; `git diff --check`; `npm run check:architecture` pasó para este lote.
- **Pendiente:** 2.5, 2.6, 3.5 y 3.6 requieren QA visual/manual, teclado de pantalla completa y/o rutas directas protegidas. No se marcan como completas sin esa evidencia.
