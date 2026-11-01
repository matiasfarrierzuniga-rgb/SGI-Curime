# Tasks

## 1. Sustitución transaccional backend

- [x] 1.1 Añadir DTO y endpoint protegido para sustituir un nombramiento; verificar metadata de `adm.institutional-board.manage`.
- [x] 1.2 Implementar cierre del registro anterior, creación del sucesor y auditoría dentro de una transacción; verificar pruebas de éxito, rollback y validaciones de persona/fecha.

## 2. Flujo administrativo frontend

- [x] 2.1 Añadir API y mutación de sustitución con invalidación de períodos; verificar prueba de hook o llamada simulada.
- [x] 2.2 Exponer formulario guiado de sustitución para gestión, preservando selector Person y solo-lectura sin permiso; verificar prueba de interfaz con payload y restricción visual.

## 3. Fast verify

- [x] 3.1 Ejecutar pruebas focalizadas backend y frontend, `check:architecture` frontend y `git diff --check`; registrar resultados sin ejecutar migraciones ni datos reales.

## Workflow follow-up

- No archivar hasta completar alcance, revisión y aprobación correspondiente.
