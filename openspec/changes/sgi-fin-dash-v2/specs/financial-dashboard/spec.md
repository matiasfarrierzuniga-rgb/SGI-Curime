# Spec Delta

## Purpose

Define un dashboard financiero autorizado, preciso y resiliente que consolida movimientos y cargos existentes sin alterar sus contratos ni atribuir significados contables no aprobados.

## ADDED Requirements

### Requirement: FIN-DASH-01 — Resumen financiero del período
El sistema SHALL mostrar ingresos, egresos y balance registrado para el período seleccionado usando el resumen financiero autorizado y preservando sus valores decimales y moneda.

#### Scenario: Mes actual predeterminado
- **WHEN** una persona con `fin.movements.read` abre el dashboard sin seleccionar otro período
- **THEN** el sistema consulta el mes actual y muestra `totalIncome`, `totalExpenses` y `balance` en CRC

#### Scenario: Período seleccionado
- **WHEN** la persona selecciona otro mes
- **THEN** los tres indicadores coinciden con `GET /financial/movements/summary` para los límites de ese mes

#### Scenario: Significado del balance
- **WHEN** se presenta el balance del período
- **THEN** se identifica como ingresos menos egresos registrados y no como dinero disponible, saldo conciliado ni comparación porcentual

### Requirement: FIN-DASH-02 — Evolución mensual de movimientos
El sistema SHALL comparar ingresos y egresos mediante seis intervalos mensuales consecutivos, completos y no superpuestos obtenidos del resumen autorizado.

#### Scenario: Serie temporal de seis meses
- **WHEN** los seis resúmenes mensuales finalizan correctamente
- **THEN** el sistema muestra barras agrupadas con ingresos en verde institucional, egresos en dorado, etiquetas mensuales y valores CRC

#### Scenario: Integridad de intervalos
- **WHEN** se construye la serie de seis meses
- **THEN** cada movimiento del período total pertenece a un único intervalo y la suma decimal de los intervalos equivale al resumen del período total correspondiente

#### Scenario: Consulta accesible del gráfico
- **WHEN** una persona enfoca o activa un dato del gráfico mediante teclado o puntero
- **THEN** recibe el mes, tipo de movimiento y valor CRC mediante información accesible que no depende solo del color

#### Scenario: Fallo parcial de un intervalo
- **WHEN** uno o más resúmenes mensuales fallan
- **THEN** el bloque informa que la evolución no está completa y permite reintentar sin ocultar datos válidos de otros bloques

### Requirement: FIN-DASH-03 — Estado actual de cargos
El sistema SHALL mostrar cantidades actuales de cargos `PENDING`, `PAID` y `CANCELLED` obtenidas del campo `total` de consultas filtradas independientes.

#### Scenario: Distribución disponible
- **WHEN** las tres consultas de cargos responden correctamente
- **THEN** el donut muestra el conteo de cada estado y un total igual a la suma de los tres conteos, sin representarlos como importes monetarios

#### Scenario: Independencia del período de movimientos
- **WHEN** la persona cambia el mes de movimientos
- **THEN** la distribución de cargos permanece identificada como «Estado actual» y no se filtra por ese mes

#### Scenario: Navegación desde la distribución
- **WHEN** la persona activa el acceso al listado desde la distribución y tiene `fin.charges.read`
- **THEN** el sistema navega al listado de cargos existente sin alterar su comportamiento actual

#### Scenario: Sin cargos
- **WHEN** los tres campos `total` son cero
- **THEN** el sistema muestra un estado vacío en lugar de un donut engañoso

### Requirement: FIN-DASH-04 — Movimientos recientes reales
El sistema SHALL mostrar una página pequeña de movimientos reales en el orden descendente vigente por fecha de ocurrencia e identificador.

#### Scenario: Movimientos disponibles
- **WHEN** la consulta de movimientos recientes responde con elementos
- **THEN** cada fila muestra fecha, descripción, tipo y monto a partir de `id`, `type`, `source`, `amount`, `currency`, `description` y `occurredAt`

#### Scenario: Empate de fecha
- **WHEN** dos movimientos tienen el mismo `occurredAt`
- **THEN** el movimiento con mayor `id` aparece primero

#### Scenario: Navegación de movimientos
- **WHEN** la persona activa una fila o el acceso al historial
- **THEN** puede abrir el detalle real o navegar a `/app/financial/movements` sin estados de aprobación ni categorías inferidas

#### Scenario: Sin movimientos recientes
- **WHEN** la consulta responde con una lista vacía
- **THEN** el bloque muestra un estado vacío y conserva el acceso autorizado al historial

### Requirement: FIN-DASH-05 — Acceso por capacidades existentes
El sistema MUST autorizar `/app/financial/dashboard` mediante autenticación, acceso ERP y al menos una capacidad de lectura financiera existente, sin depender del nombre del rol.

#### Scenario: Acceso completo
- **WHEN** la persona tiene `fin.movements.read` y `fin.charges.read`
- **THEN** puede abrir el dashboard y consultar los bloques de movimientos y cargos

#### Scenario: Solo lectura de movimientos
- **WHEN** la persona tiene `fin.movements.read` pero no `fin.charges.read`
- **THEN** puede abrir el dashboard y solo se consultan y muestran resumen, evolución, movimientos recientes y accesos de movimientos

#### Scenario: Solo lectura de cargos
- **WHEN** la persona tiene `fin.charges.read` pero no `fin.movements.read`
- **THEN** puede abrir el dashboard y solo se consultan y muestran conteos, distribución y accesos de cargos

#### Scenario: Sin capacidad financiera de lectura
- **WHEN** la persona no tiene `fin.movements.read` ni `fin.charges.read`
- **THEN** el acceso directo al dashboard resulta denegado y la navegación no ofrece su enlace

#### Scenario: Capacidad de pago independiente
- **WHEN** la persona tiene `fin.charges.read` pero no `fin.payments.record`
- **THEN** puede consultar el bloque de cargos sin recibir acciones para registrar pagos

#### Scenario: Rutas existentes preservadas
- **WHEN** se incorpora el dashboard
- **THEN** `/app/financial`, `/app/financial/movements`, `/app/financial/dinadeco` y `/app/donations` conservan su comportamiento y autorización vigentes

### Requirement: Actualización derivada después de pagos
El sistema SHALL invalidar datos de cargos y movimientos afectados después de registrar un pago para evitar indicadores obsoletos.

#### Scenario: Pago registrado correctamente
- **WHEN** `POST /financial/charges/:id/payments` finaliza correctamente
- **THEN** se actualizan listas y detalle de cargos, listas de movimientos, resúmenes financieros y visualizaciones derivadas activas

#### Scenario: Conflicto de pago
- **WHEN** el registro de pago responde con conflicto y puede haber datos concurrentes más recientes
- **THEN** se actualizan al menos la lista y el detalle del cargo sin presentar el pago como exitoso

### Requirement: FIN-DASH-06 — Experiencia accesible, responsive y resiliente
El sistema SHALL presentar cada dominio autorizado con estados independientes de carga, vacío y error, dentro del layout ERP y con los tokens institucionales vigentes.

#### Scenario: Fallo de un dominio
- **WHEN** falla una consulta de movimientos o de cargos y el otro dominio entrega datos
- **THEN** el sistema conserva el dominio disponible y muestra error con reintento únicamente en el bloque afectado

#### Scenario: Carga progresiva
- **WHEN** las consultas tienen tiempos de respuesta distintos
- **THEN** cada bloque comunica su propia carga sin bloquear ni colapsar el dashboard completo

#### Scenario: Viewports requeridos
- **WHEN** el dashboard se consulta a 1440, 1366, 1280, 1024, 768, 375 o 320 píxeles
- **THEN** mantiene jerarquía legible, acciones utilizables y contenido sin desbordamiento horizontal de página

#### Scenario: Operación con teclado y lector de pantalla
- **WHEN** una persona recorre filtros, gráficos, reintentos y enlaces sin puntero
- **THEN** dispone de orden de foco lógico, foco visible, nombres accesibles y estados comunicados semánticamente
