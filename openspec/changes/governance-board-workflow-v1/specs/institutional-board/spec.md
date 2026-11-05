# Spec Delta

## Purpose

Define administración auditable de períodos, nombramientos y sustituciones de Junta Directiva sin atribuir cargos desde roles de software.

## ADDED Requirements

### Requirement: Sustitución atómica de nombramiento
El sistema SHALL permitir a una persona autorizada sustituir un nombramiento existente cerrando su vigencia y creando un nombramiento sucesor en una sola operación atómica, preservando ambas filas como historial.

#### Scenario: Sustitución registrada
- **WHEN** un administrador sustituye un nombramiento con una persona existente, fecha de finalización y datos válidos del sucesor
- **THEN** el nombramiento anterior conserva su fila con la fecha de finalización y se crea el sucesor en el mismo período

#### Scenario: Error durante sustitución
- **WHEN** cualquier validación o escritura de una sustitución falla
- **THEN** el nombramiento anterior conserva su vigencia previa y no se crea ningún sucesor

### Requirement: Autorización y trazabilidad de sustitución
El sistema SHALL exigir `adm.institutional-board.manage` para sustituir un nombramiento y SHALL registrar la acción sin datos personales en la auditoría institucional.

#### Scenario: Consulta sin permiso de gestión
- **WHEN** una persona con solo `adm.institutional-board.read` consulta Junta Directiva
- **THEN** puede ver períodos e historial, pero no recibe ni puede ejecutar la acción de sustitución

#### Scenario: Sustitución autorizada
- **WHEN** una persona con `adm.institutional-board.manage` completa una sustitución válida
- **THEN** se registra una acción de auditoría con ids de registros y campos modificados, sin PII

### Requirement: Separación de cargo institucional y autorización
El sistema SHALL seleccionar al sucesor desde Personas existentes y SHALL NOT derivar, crear o modificar Roles, permisos, afiliaciones ni reglas de elegibilidad durante una sustitución.

#### Scenario: Sucesor seleccionado person-first
- **WHEN** un administrador busca y selecciona una persona para una sustitución
- **THEN** la operación referencia la Persona seleccionada y no infiere el nombramiento desde un Role de software
