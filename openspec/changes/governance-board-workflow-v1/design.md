# Design

## Context

Ver `proposal.md`. El backend ya valida fechas, existencia de Persona, alcance del período y ejecuta creación/actualización dentro de transacciones. UI ya impide cambiar Persona en edición normal; el contrato operativo establece que una sustitución cierra el registro anterior y crea otro.

## Goals / Non-Goals

**Goals:**
- Convertir sustitución en una única mutación transaccional y auditable.
- Reusar DTO, validaciones, selector person-first, capacidades, React Query y componentes existentes.

**Non-Goals:**
- Cambios Prisma, migraciones, estados de `GovernanceTerm`, catálogo `GovernancePosition`, enlace a afiliación/Asamblea, cupos, solapamientos, elegibilidad, DINADECO o reglas estatutarias.

## Decisions

1. Agregar comando específico de sustitución, protegido por `adm.institutional-board.manage`. Encapsula cierre y creación en la misma transacción; evita que dos llamadas UI independientes dejen historia parcial. Alternativa descartada: orquestar PATCH + POST en frontend, porque no ofrece atomicidad.
2. Reutilizar `CreateBoardAppointmentDto` para datos del sucesor junto con fecha explícita de cierre. El backend valida ambos rangos con las reglas actuales y usa Persona existente. Alternativa descartada: aceptar un `personId` mutable en PATCH, porque contradice el contrato de historial.
3. Añadir acción de sustitución en la fila y formulario guiado que conserva el registro previo visible, requiere selección de Persona y muestra errores del backend. Al éxito invalida términos mediante hook existente. Alternativa descartada: exponer eliminación, prohibida por el contrato actual.
4. Auditar cierre y creación con acciones existentes `BOARD_APPOINTMENT_UPDATED` y `BOARD_APPOINTMENT_CREATED`; no inventar evento nuevo. Ambas auditorías viven en la transacción y conservan solo ids/campos.

## Risks / Trade-offs

- [Reglas legales o estatutarias no documentadas] → validar solo fechas y persona existente; no inferir elegibilidad ni cupos.
- [Datos transicionales `Board*`/`Governance*`] → conservar tablas físicas, campos legacy y contrato API actual; sin Prisma.
- [Fallo parcial] → una transacción única para cierre, sucesor y auditoría.

## Migration Plan

No requiere migración ni datos. Despliegue compatible: nuevo endpoint y control UI; rollback elimina la exposición de la acción sin alterar filas existentes.
