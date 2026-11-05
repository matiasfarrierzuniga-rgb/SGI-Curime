# Treasury requirements

## Resumen consolidado
El sistema DEBE agregar todos los movimientos CRC aplicables, no una página, con precisión Decimal y desglose por origen.

## Cuentas por cobrar
El sistema DEBE exponer cargos pendientes separadamente y NO tratarlos como efectivo.

## Saldo inicial
Sin registro institucional válido, el sistema DEBE mostrar “Saldo inicial no establecido” y NO publicar saldo registrado/disponible.

## Integridad
El sistema DEBE identificar pagos y donaciones confirmados sin movimiento enlazado, sin corregir históricos automáticamente.

## Acceso
API y vista DEBEN exigir lectura de movimientos y cargos.
