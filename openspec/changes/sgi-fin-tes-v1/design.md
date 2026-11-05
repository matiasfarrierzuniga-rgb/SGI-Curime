# Diseño

`FinancialMovement` es ledger de lectura. Se incluyen CRC con `status=POSTED` o legado `null`, no anulados. Prisma `Decimal` agrega importes por tipo y origen.

`Payment.movementId @unique` y `Donation.originalMovementId @unique`, junto con transacciones de creación, evitan segunda contabilización en flujos actuales. El resumen informa pagos/donaciones confirmados sin enlace; no altera históricos ambiguos.

Fórmulas:
- ingresos = suma INCOME
- egresos = suma EXPENSE
- neto registrado = ingresos − egresos
- cuentas por cobrar = suma de cargos PENDING CRC
- saldo registrado = saldo inicial + neto; permanece `null` porque no existe saldo inicial institucional certificado.

Autorización: API y ruta requieren `fin.movements.read` + `fin.charges.read`.
