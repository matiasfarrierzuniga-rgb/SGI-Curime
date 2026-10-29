# SGI-FIN-TES-V1 — Tesorería institucional

## Objetivo
Consolidar lectura de fondo institucional CRC desde `FinancialMovement`, diferenciando efectivo registrado, resultado neto y cargos pendientes por cobrar.

## Alcance
- API protegida de resumen acumulado y mensual.
- Verificación visible de enlaces Payment/Donation → FinancialMovement.
- Vista `/app/financial` de Tesorería; cargos permanecen en `/app/financial/charges`.
- Sin saldo inicial inventado, conciliación bancaria, pagos parciales ni eventos sin cobro real.

## Evidencia V1 y CU V2
V1 confirma movimientos manuales, pagos de reserva y donaciones atómicas. CU V2 relacionados: `NOT_VERIFIED`; catálogo inmutable no disponible en workspace.
