# Plantillas ADI / DINADECO: requisitos y mapeo de fuentes

Las plantillas fueron entregadas funcionalmente por la Asociación de Desarrollo Integral de Curime y son documentos reales usados por la ADI para sus trámites e informes. Los originales permanecen fuera del repositorio versionado, en la carpeta privada local `private-reference/adi/`, excluida mediante `.git/info/exclude`. Este documento contiene únicamente requisitos, estructura documental y comparación técnica; no reproduce personas del padrón, identificaciones, firmas ni valores privados.

Estado: análisis de fuentes, sin implementación. Fecha: 2026-09-17. Base revisada: `07354403758bdcd9b2ef84efbb2e4240e4427d6b`, rama `feature/dinadeco-templates-affiliate-registry`, coincidente con `main` local y con el merge del PR #87. No se consultó Internet para interpretar los formularios. Las referencias normativas impresas se describen como contenido de los originales, sin verificar su vigencia ni convertirlas en reglas adicionales del sistema.

## Alcance, evidencia y criterios

Se leyeron `README.md`, `docs/README.md`, `CONTRIBUTING.md`, `frontend/CONVENTIONS.md`, la skill `sgi-development-foundation` y los documentos de Financiero y Afiliados. Se aplicó la skill Excel para el análisis de hojas; no se produjo ningún workbook ni se alteraron originales.

Fuentes técnicas contrastadas:

- [`schema.prisma`](../../backend/prisma/schema.prisma): modelos y restricciones reales.
- [`dinadeco-reports.service.ts`](../../backend/src/financial/dinadeco-reports.service.ts), su controlador, DTO anual y pruebas: agregación del reporte.
- [`financial.service.ts`](../../backend/src/financial/financial.service.ts), controladores de movimientos y DTOs: datos financieros y pagos disponibles.
- [`donations.service.ts`](../../backend/src/donations/donations.service.ts): movimientos originales y reversos de donaciones; se consultó para confirmar el origen financiero.
- [`report-metadata.ts`](../../backend/src/reporting/report-metadata.ts) y [`admin-reports.service.ts`](../../backend/src/admin-reports/admin-reports.service.ts): procedencia de reportes y conteos de asistencia.
- [`affiliates.service.ts`](../../backend/src/affiliates/affiliates.service.ts), controlador y DTOs; [`identity-reconciliation.ts`](../../backend/src/identity-reconciliation/identity-reconciliation.ts), [`identity-link-migration.ts`](../../backend/src/identity-reconciliation/identity-link-migration.ts), reconciliación manual y resolución de Person en `backend/src/identity/`.
- [`assemblies.service.ts`](../../backend/src/assemblies/assemblies.service.ts), controlador y DTOs: convocados, asistencia, cuórum y ciclo de asamblea.
- Features frontend `financial`, `affiliates` y `assemblies`, sus APIs, contratos y páginas; [`AppRoutes.tsx`](../../frontend/src/app/router/AppRoutes.tsx).

Método: lectura local del XLS binario y sus registros de fórmulas; lectura de celdas, fórmulas y combinaciones de los XLSX; párrafos y tabla del DOCX; texto del FRAG; inspección exclusivamente estructural del padrón escaneado, con encabezados y ordinales separados de las columnas personales. No se realizó OCR ni matching de personas. Los lectores auxiliares se instalaron en una carpeta temporal, sin cambiar dependencias del proyecto. La existencia de infraestructura se verificó en código, sin ejecutar importadores, acceder a una base de datos ni afirmar cobertura de datos productivos.

Los estados de la matriz significan:

| Estado | Criterio |
| --- | --- |
| AVAILABLE | Existe un campo o contrato actual con significado compatible; no garantiza que esté poblado para un caso real. |
| DERIVABLE | Se puede calcular o componer desde datos actuales; se explicitan límites y validaciones. |
| MANUAL_REQUIRED | Declaración, decisión, firma, sello, recepción o dato de emisión que debe confirmar una persona. |
| MISSING_MODEL | Falta persistencia con semántica suficiente, aunque exista texto libre o información personal reutilizable. |
| NOT_APPLICABLE | No corresponde a una entrada del sistema en este alcance; no se usa para ocultar un campo faltante. |

«Automatizable» describe posibilidad con el sistema actual: «Sí» no implica generación implementada; «Parcial» exige revisión, conciliación o selección humana; «No» requiere intervención o datos/modelos nuevos. No se atribuyen cargos legales a usuarios a partir de sus roles de acceso.

## Inventario documental

| Archivo privado | Nombre observado / estructura | Finalidad y período |
| --- | --- | --- |
| `FIE.xls` | Hoja `Informe económico`; título literal «Formulario declaración de Informe Ecónomico Anual» (grafía del original). Contenido útil A2:E30; dimensión almacenada 709 filas y 5 columnas, con extensión sin contenido sustantivo. | Declaración conjunta de presidencia y tesorería de todos los movimientos económicos del 1 de enero al 31 de diciembre del año indicado. |
| `FLFGirarISR.xlsx` | «Formulario para liquidar los recursos del FONDO POR GIRAR»; hoja `Liquidacion Fondos por Girar`; área de impresión B2:X39. | Liquidar recursos entregados y gastos propios vinculados al plan de trabajo aprobado y presentado regionalmente. No hay año/período anual explícito; existe fecha de entrega. |
| `FLICemento.xlsx` | «Formulario para liquidar los recursos provenientes del IMPUESTO AL CEMENTO»; hoja `Liquidacion Impuesto al Cemento`; área de impresión B2:X39. | Misma estructura de liquidación para ese origen de fondos. No se observa un régimen contable diferente en sus campos. |
| `FRAG.pdf` | «FORMULARIO RESULTADO DE ASAMBLEA GENERAL», una página con texto extraíble. | Comunicar celebración, resultados y nombramientos de una asamblea; incluye período de Junta Directiva. |
| `FCIdoneidad.docx` | Una solicitud y cuatro declaraciones juradas; una tabla de instituciones y montos en la última declaración. | Calificación de idoneidad y declaraciones de control, libros, responsabilidad y transferencias. La última pide año presupuestario. |
| `PADRON AFILIADOS.pdf` | Nueve páginas, una imagen escaneada de 1700 × 2200 por página, sin capa de texto extraíble. | Padrón histórico como fuente privada de estructura y futura reconciliación; no acredita por sí solo estado o fechas históricas. |

No se observaron datos personales completados en los cinco formularios vacíos. Esto no autoriza versionar los originales ni futuros formularios completados.

## Matriz maestra de campos

### FIE

Ubicaciones: encabezado A2, declaración institucional A5, anexo A6, detalle A7:E22, resúmenes A23:E25, firmas A27:E28, sello A29 y recepción A30. Hay quince posiciones numeradas de entradas; la columna de salidas dispone de quince espacios paralelos. La etiqueta de cédula jurídica aparece truncada como «cédula ju…» en A5: confirmar su impresión con la ADI antes de preparar una salida.

| Documento | Campo oficial | Fuente SGI-Curime | Estado | Automatizable | Observación |
| --- | --- | --- | --- | --- | --- |
| FIE | Año; del 1 de enero al 31 de diciembre | `data.year`, `metadata.period` | AVAILABLE | Sí | Intervalo del API con fin exclusivo; la plantilla expresa fin inclusivo. |
| FIE | Nombre de quien ocupa presidencia | Person / Affiliate / User como candidatos; sin cargo legal | MISSING_MODEL | No | Falta nombramiento vigente y representante autorizado. |
| FIE | Documento de identidad de presidencia | `Person.identification`, `identificationType`; Affiliate legado | AVAILABLE | Parcial | Solo después de seleccionar y validar al titular; no es cédula jurídica. |
| FIE | Nombre de quien ocupa tesorería | Person / Affiliate / User como candidatos; sin cargo legal | MISSING_MODEL | No | Un rol de acceso Tesorero no prueba nombramiento legal. |
| FIE | Documento de identidad de tesorería | Person / Affiliate | AVAILABLE | Parcial | Selección humana del titular pendiente. |
| FIE | Organización comunal denominada | Ninguna fuente institucional única | MISSING_MODEL | No | Nombre legal, no nombre de página o usuario. |
| FIE | Cédula jurídica (etiqueta truncada) | Ninguna | MISSING_MODEL | No | Confirmar etiqueta y formato del original; no usar identificación personal. |
| FIE | N° código de registro | Ninguna | MISSING_MODEL | No | Código DINADECO. |
| FIE | Provincia | Ninguna fuente institucional | MISSING_MODEL | No | No inferir de dirección personal. |
| FIE | Cantón | Ninguna fuente institucional | MISSING_MODEL | No | Requiere dato de organización validado. |
| FIE | Distrito | Ninguna fuente institucional | MISSING_MODEL | No | Requiere dato de organización validado. |
| FIE | Teléfono para notificaciones | Ninguna fuente institucional | MISSING_MODEL | No | Teléfonos personales no son sustituto automático. |
| FIE | Correo para notificaciones | Ninguna fuente institucional | MISSING_MODEL | No | Cuenta de acceso no equivale al correo institucional. |
| FIE | Entradas: descripción, posiciones 1–15 | `FinancialMovement.description`, tipo INCOME | AVAILABLE | Parcial | Datos de movimiento disponibles fuera del reporte agregado; criterio de agrupación pendiente. |
| FIE | Entradas: monto en colones | `FinancialMovement.amount`, INCOME, CRC | AVAILABLE | Parcial | Exige cobertura íntegra, clasificación y tratamiento de más de quince filas. |
| FIE | Salidas: descripción, quince espacios | `FinancialMovement.description`, EXPENSE | AVAILABLE | Parcial | No existen cuentas contables oficiales asociadas. |
| FIE | Salidas: monto en colones | `FinancialMovement.amount`, EXPENSE, CRC | AVAILABLE | Parcial | Reversos de donaciones también son egresos operativos; revisar presentación. |
| FIE | Total de entradas en el período | `income.total` / suma INCOME anual | DERIVABLE | Sí | Solo historial registrado; no sumar Donation por segunda vez. |
| FIE | Total de salidas en el período | `expenses.total` / suma EXPENSE anual | DERIVABLE | Sí | No garantiza que todas las salidas reales estén registradas. |
| FIE | Saldo inicial del período | `openingBalance` | DERIVABLE | Parcial | Neto histórico SGI; requiere conciliación con saldo oficial anterior. |
| FIE | Saldo final en caja al 31 de diciembre | `closingBalance` como candidato | DERIVABLE | Parcial | Neto histórico no distingue caja de banco; no afirmar equivalencia sin revisión. |
| FIE | Total de entradas más el saldo inicial | `income.total + openingBalance` | DERIVABLE | Parcial | Decimal; depende de validar el saldo inicial. |
| FIE | Total de salidas más el saldo final | `expenses.total + closingBalance` | DERIVABLE | Parcial | Igualdad aritmética no prueba conciliación de caja/bancos. |
| FIE | Declaración de legitimidad y veracidad | Ninguna certificación automática | MANUAL_REQUIRED | No | Deben ratificar los declarantes; metadata no sustituye juramento. |
| FIE | Nombre y N° cédula en pie de presidencia | Persona seleccionada; cargo no modelado | AVAILABLE | Parcial | Reutilizar identidad validada, sin inferir el nombramiento. |
| FIE | Nombre y N° cédula en pie de tesorería | Persona seleccionada; cargo no modelado | AVAILABLE | Parcial | Mismo límite. |
| FIE | Firma de presidencia | Ninguna | MANUAL_REQUIRED | No | Firma manual inicial; no extraer ni almacenar. |
| FIE | Firma de tesorería | Ninguna | MANUAL_REQUIRED | No | Firma manual inicial. |
| FIE | Sello de la organización | Ninguna | MANUAL_REQUIRED | No | Mantener colocación manual. |
| FIE | Copia de estado de cuenta bancario con corte al 31 de diciembre | Ningún expediente financiero asociado | MISSING_MODEL | No | Anexo expresamente obligatorio en A6. |
| FIE | Recibido en oficina regional por | Ninguna | MANUAL_REQUIRED | No | Completa la oficina receptora, no el generador SGI. |
| FIE | Fecha y hora de recepción | Ninguna | MANUAL_REQUIRED | No | No usar `generatedAt`. |
| FIE | Sello de recepción | Ninguna | MANUAL_REQUIRED | No | Exclusivo de oficina regional. |
| FIE | Artículo 39 inciso e), nota impresa | Texto fijo del original | NOT_APPLICABLE | No | No es campo variable ni regla de cálculo; conservar contenido si se autoriza futura generación. |

### Liquidaciones

Las filas que indican «FLFGirarISR / FLICemento» aplican individualmente a ambos originales; no omiten campos particulares. Ubicaciones comunes: datos generales filas 7–11, gastos 14–25, totales 26, remanente 28–29, declaración 32, firmantes 35/37, recepción 39.

| Documento | Campo oficial | Fuente SGI-Curime | Estado | Automatizable | Observación |
| --- | --- | --- | --- | --- | --- |
| FLFGirarISR | Recursos del FONDO POR GIRAR | Ningún fondo/asignación | MISSING_MODEL | No | Origen institucional explícito en el título. |
| FLICemento | Recursos provenientes del IMPUESTO AL CEMENTO | Ningún fondo/asignación | MISSING_MODEL | No | Origen distinto; no equivale a `FinancialMovementSource`. |
| FLFGirarISR / FLICemento | Nombre de la organización | Ninguna fuente institucional | MISSING_MODEL | No | Nombre legal compartido. |
| FLFGirarISR / FLICemento | Número de cédula jurídica | Ninguna | MISSING_MODEL | No | No confundir con Person. |
| FLFGirarISR / FLICemento | Código de registro | Ninguna | MISSING_MODEL | No | DINADECO. |
| FLFGirarISR / FLICemento | Región | Ninguna | MISSING_MODEL | No | Confirmar catálogo/región competente, sin inventarlo. |
| FLFGirarISR / FLICemento | Provincia | Ninguna fuente institucional | MISSING_MODEL | No | Dato de organización. |
| FLFGirarISR / FLICemento | Cantón | Ninguna fuente institucional | MISSING_MODEL | No | Dato de organización. |
| FLFGirarISR / FLICemento | Distrito | Ninguna fuente institucional | MISSING_MODEL | No | Dato de organización. |
| FLFGirarISR / FLICemento | Fecha de entrega de recursos | Ninguna asignación de fondo | MISSING_MODEL | No | `occurredAt` podría documentar un ingreso, pero no acredita entrega específica. |
| FLFGirarISR / FLICemento | Monto de recursos otorgados | Ninguna asignación de fondo | MISSING_MODEL | No | Suma de todos los ingresos no identifica monto otorgado. |
| FLFGirarISR / FLICemento | Ordinal de gasto, 1–10 | Posición de fila | DERIVABLE | Sí | No es identificador persistente de factura o movimiento. |
| FLFGirarISR / FLICemento | Proveedor, persona física o jurídica | Ningún proveedor asociado al egreso | MISSING_MODEL | No | `recordedBy` es usuario operador, no proveedor. |
| FLFGirarISR / FLICemento | Origen del gasto | `FinancialMovement.description` como apoyo | MANUAL_REQUIRED | Parcial | Significado exacto de «origen» pendiente; no mapear automáticamente a `source`. |
| FLFGirarISR / FLICemento | N° factura / comprobante | `reference` como texto auxiliar, sin semántica de factura | MISSING_MODEL | No | Requiere identificación documental y relación con gasto. |
| FLFGirarISR / FLICemento | Fecha factura | Ninguna | MISSING_MODEL | No | Fecha de movimiento no equivale necesariamente a fecha de factura. |
| FLFGirarISR / FLICemento | Monto factura en colones | `FinancialMovement.amount` como candidato | MISSING_MODEL | Parcial | Falta relación factura/gasto/fondo; no asumir un egreso por factura. |
| FLFGirarISR / FLICemento | N° acta | Ninguna acta legal | MISSING_MODEL | No | `Assembly.id` no es número de acta de acuerdo de pago. |
| FLFGirarISR / FLICemento | N° acuerdo | Ninguna | MISSING_MODEL | No | No existe acuerdo de pago estructurado. |
| FLFGirarISR / FLICemento | Fecha sesión del acuerdo | Assembly como contexto posible, sin relación legal | MISSING_MODEL | No | No inferir que es siempre Asamblea General. |
| FLFGirarISR / FLICemento | N° transferencia electrónica o cheque | `Payment.reference` como apoyo solo en cobros de reservas | MISSING_MODEL | No | No existe pago saliente al proveedor ni cheque modelado. |
| FLFGirarISR / FLICemento | Fecha emisión | Ninguna para pago saliente | MISSING_MODEL | No | `Payment.paidAt` no acredita emisión de cheque. |
| FLFGirarISR / FLICemento | Monto del medio de pago en colones | Ningún pago saliente relacionado | MISSING_MODEL | No | No confundir con monto de factura ni total anual EXPENSE. |
| FLFGirarISR / FLICemento | Total de montos de factura (K26) | No hay gastos identificados por asignación | MISSING_MODEL | No | Aritmética simple cuando exista detalle validado. |
| FLFGirarISR / FLICemento | Total de montos de pago (W26) | No hay medios salientes por asignación | MISSING_MODEL | No | La plantilla mantiene dos totales, no un único total sin distinción. |
| FLFGirarISR / FLICemento | Remanente (D29) | Sin asignación y total liquidado validado | MISSING_MODEL | No | Fórmula del original con referencias incongruentes; confirmar base del remanente. |
| FLFGirarISR / FLICemento | Juramento sobre gastos y plan de trabajo | Ninguna certificación | MANUAL_REQUIRED | No | Exige confirmación humana; plan aprobado/presentado no modelado. |
| FLFGirarISR / FLICemento | Nombre del presidente | Personas candidatas, sin nombramiento | MISSING_MODEL | No | Falta Junta Directiva vigente. |
| FLFGirarISR / FLICemento | Número de cédula del presidente | Person / Affiliate | AVAILABLE | Parcial | Reutilizable tras selección autorizada. |
| FLFGirarISR / FLICemento | Nombre del tesorero | Personas candidatas, sin nombramiento | MISSING_MODEL | No | Falta cargo legal vigente. |
| FLFGirarISR / FLICemento | Número de cédula del tesorero | Person / Affiliate | AVAILABLE | Parcial | Reutilizable tras selección autorizada. |
| FLFGirarISR / FLICemento | Firma presidente | Ninguna | MANUAL_REQUIRED | No | Manual inicialmente. |
| FLFGirarISR / FLICemento | Firma tesorería | Ninguna | MANUAL_REQUIRED | No | Manual inicialmente. |
| FLFGirarISR / FLICemento | Recibido Dirección Regional | Ninguna | MANUAL_REQUIRED | No | Oficina receptora. |
| FLFGirarISR / FLICemento | Fecha recepción | Ninguna | MANUAL_REQUIRED | No | No es fecha de generación. |
| FLFGirarISR / FLICemento | Hora recepción | Ninguna | MANUAL_REQUIRED | No | Oficina receptora. |
| FLFGirarISR / FLICemento | Sello | Ninguna | MANUAL_REQUIRED | No | Está en bloque de recepción; no se observa campo separado de sello de ADI. |

### Resultado de Asamblea General

| Documento | Campo oficial | Fuente SGI-Curime | Estado | Automatizable | Observación |
| --- | --- | --- | --- | --- | --- |
| FRAG | Dirección Regional | Ninguna fuente institucional | MISSING_MODEL | No | Encabezado regional. |
| FRAG | Fecha del formulario | Fecha de emisión a confirmar | MANUAL_REQUIRED | Parcial | Es distinta de fecha de celebración; `generatedAt` no la certifica. |
| FRAG | Nombre organización | Ninguna fuente institucional | MISSING_MODEL | No | Nombre legal. |
| FRAG | Integral / Específica | Ninguna clasificación institucional | MISSING_MODEL | No | No equivale a `Affiliate.affiliateType`. |
| FRAG | De (lugar) | Ninguna fuente institucional | MISSING_MODEL | No | Localidad de organización, distinta del lugar de sesión. |
| FRAG | Código registro | Ninguna | MISSING_MODEL | No | DINADECO. |
| FRAG | Ordinaria / extraordinaria | `Assembly.type` | AVAILABLE | Parcial | Es String opcional, no enum que garantice estas opciones. |
| FRAG | Convocada por 10 % de afiliados / Fiscalía / Junta Directiva | Ninguna autoridad convocante | MISSING_MODEL | No | Convocation representa destinatarios, no quién convoca. |
| FRAG | Día, mes y año de celebración | `Assembly.date` | AVAILABLE | Parcial | Fecha programada; confirmar celebración efectiva y zona horaria. |
| FRAG | Lugar de celebración | `Assembly.place` | AVAILABLE | Parcial | Confirmar lugar real si cambió respecto de programación. |
| FRAG | Primera / segunda convocatoria | Ninguna | MISSING_MODEL | No | Cuórum fijo/porcentaje y `convenedAt` no representan ronda de convocatoria. |
| FRAG | # afiliados presentes | Conteo `AssemblyAttendance.status = PRESENT` | DERIVABLE | Sí | Con registro completo y revisado de la asamblea seleccionada. |
| FRAG | Dirección física para correspondencia | Ninguna fuente institucional | MISSING_MODEL | No | Dirección personal no sustituye dirección de organización. |
| FRAG | Telefax | Ninguna fuente institucional | MISSING_MODEL | No | No se observa casilla telefónica institucional separada del telefax. |
| FRAG | Correo electrónico | Ninguna fuente institucional | MISSING_MODEL | No | Correo de correspondencia. |
| FRAG | Nombramiento total / parcial | Ninguna elección estructurada | MISSING_MODEL | No | No derivar del estado de asamblea. |
| FRAG | Período Junta Directiva | Ninguna | MISSING_MODEL | No | Requiere vigencia de nombramientos. |
| FRAG | Presidencia: nombre, identificación, Tel | Person / Affiliate para identidad; sin elección | MISSING_MODEL | Parcial | Identidad reutilizable si existe, designación no registrada. |
| FRAG | Vicepresidencia: nombre, identificación, Tel | Person / Affiliate; sin elección | MISSING_MODEL | Parcial | No convertir Role en cargo legal. |
| FRAG | Secretaría: nombre, identificación, Tel | Person / Affiliate; sin elección | MISSING_MODEL | Parcial | Falta designación. |
| FRAG | Tesorería: nombre, identificación, Tel | Person / Affiliate; sin elección | MISSING_MODEL | Parcial | Falta designación. |
| FRAG | Vocal 1: nombre, identificación, Tel | Person / Affiliate; sin elección | MISSING_MODEL | Parcial | Falta posición y vigencia. |
| FRAG | Vocal 2: nombre, identificación, Tel | Person / Affiliate; sin elección | MISSING_MODEL | Parcial | Mismo límite. |
| FRAG | Vocal 3: nombre, identificación, Tel | Person / Affiliate; sin elección | MISSING_MODEL | Parcial | Mismo límite. |
| FRAG | Fiscal 1: nombre, identificación, Tel | Person / Affiliate; sin nombramiento | MISSING_MODEL | Parcial | Cantidad según estatuto; tres espacios, no obligación automática de tres. |
| FRAG | Fiscal 2: nombre, identificación, Tel | Person / Affiliate; sin nombramiento | MISSING_MODEL | Parcial | Confirmar aplicabilidad con estatuto. |
| FRAG | Fiscal 3: nombre, identificación, Tel | Person / Affiliate; sin nombramiento | MISSING_MODEL | Parcial | Confirmar aplicabilidad con estatuto. |
| FRAG | Suplencia 1: nombre, identificación, Tel | Person / Affiliate; sin nombramiento | MISSING_MODEL | Parcial | Cantidad según estatuto. |
| FRAG | Suplencia 2: nombre, identificación, Tel | Person / Affiliate; sin nombramiento | MISSING_MODEL | Parcial | Confirmar aplicabilidad. |
| FRAG | Suplencia 3: nombre, identificación, Tel | Person / Affiliate; sin nombramiento | MISSING_MODEL | Parcial | Confirmar aplicabilidad. |
| FRAG | Se aprobó reformas al estatuto: Sí / No | Ninguna resolución de reforma | MISSING_MODEL | No | No interpretar `description` como aprobación formal. |
| FRAG | Cuáles artículos reformados | Ninguna | MISSING_MODEL | No | Falta trazabilidad de texto/reforma y decisión. |
| FRAG | Se aprobó Plan de Trabajo: Sí / No | Ningún plan/aprobación | MISSING_MODEL | No | No derivar de asamblea COMPLETED. |
| FRAG | Nombre firmante presidencia | Identidad disponible, representación no registrada | MISSING_MODEL | Parcial | Validar quién firma este resultado. |
| FRAG | Nombre firmante secretaría | Identidad disponible, representación no registrada | MISSING_MODEL | Parcial | Validar titular/autorización. |
| FRAG | Firma presidencia | Ninguna | MANUAL_REQUIRED | No | Mantener manual. |
| FRAG | Firma secretaría | Ninguna | MANUAL_REQUIRED | No | Mantener manual. |
| FRAG | Sello organización | Ninguna | MANUAL_REQUIRED | No | Manual. |
| FRAG | Sello recibido regional/subregional | Ninguna | MANUAL_REQUIRED | No | Exclusivo DINADECO. |
| FRAG | Fecha y hora recepción | Ninguna | MANUAL_REQUIRED | No | No usar metadata como recepción. |
| FRAG | Nombre funcionario receptor | Ninguna | MANUAL_REQUIRED | No | Completa oficina receptora. |
| FRAG | Mínimo dos copias del acta y del formulario | Ningún expediente/acta legal asociado | MISSING_MODEL | No | Una copia regional y otra para Registro; asistencia no sustituye acta. |

### Idoneidad

Las filas compartidas nombran expresamente los formularios a los que aplican. No se presume que todos pidan contacto, autorización de asamblea o monto.

| Documento | Campo oficial | Fuente SGI-Curime | Estado | Automatizable | Observación |
| --- | --- | --- | --- | --- | --- |
| FCIdoneidad: solicitud | Nombre de presidente solicitante | Identidad personal, sin representación institucional | MISSING_MODEL | Parcial | Falta nombramiento validado. |
| FCIdoneidad: solicitud | Cédula de identidad | Person / Affiliate | AVAILABLE | Parcial | Tras seleccionar representante. |
| FCIdoneidad: solicitud | Nombre completo organización como en cédula jurídica | Ninguna fuente institucional | MISSING_MODEL | No | El texto refiere Asociación de Desarrollo Integral. |
| FCIdoneidad: solicitud | Cédula jurídica | Ninguna | MISSING_MODEL | No | No reconstruir desde prefijo impreso. |
| FCIdoneidad: solicitud | Solicitud para percibir recursos del 2 % ISR; Fondo por Girar / Fondo de Proyectos según corresponda | Ningún expediente de idoneidad | MANUAL_REQUIRED | No | Declaración impresa, no selector de montos ni prueba automática de requisitos. |
| FCIdoneidad: cuatro declaraciones | Nombre de presidente | Identidad personal, sin representación institucional | MISSING_MODEL | Parcial | Titular y autorización por validar. |
| FCIdoneidad: cuatro declaraciones | Documento de identidad | Person / Affiliate | AVAILABLE | Parcial | Sin valores personales en esta documentación. |
| FCIdoneidad: cuatro declaraciones | Nombre completo organización | Ninguna fuente institucional | MISSING_MODEL | No | Reutilizable entre declaraciones cuando exista fuente validada. |
| FCIdoneidad: cuatro declaraciones | Cédula jurídica | Ninguna | MISSING_MODEL | No | Grafías/prefijos del original varían; validar dato legal, no concatenar a ciegas. |
| FCIdoneidad: reglamentos, libros y manejo fondos | Residente en | `Person.address` / `Affiliate.address` | AVAILABLE | Parcial | Domicilio del representante, no institucional; verificar vigencia. |
| FCIdoneidad: reglamentos, libros y manejo fondos | Teléfono | Person descompuesto / Affiliate | AVAILABLE | Parcial | Contacto personal opcional, requiere confirmación. |
| FCIdoneidad: reglamentos, libros y manejo fondos | Asamblea General número que autoriza | Ninguna numeración legal/autorización | MISSING_MODEL | No | `Assembly.id` no acredita número oficial ni acuerdo autorizante. |
| FCIdoneidad: reglamentos, libros y manejo fondos | Fecha de Asamblea autorizante | `Assembly.date` como contexto sin autorización enlazada | MISSING_MODEL | Parcial | Seleccionar evidencia autorizante antes de reutilizar fecha. |
| FCIdoneidad: reglamentos | Administración adecuada y mecanismos de control mediante reglamentos/manuales/instructivos/directrices | Ninguna constatación institucional | MANUAL_REQUIRED | No | Declaración narrativa, no checklist de documentos individuales. |
| FCIdoneidad: libros | Libro actas Asambleas Generales | Ningún registro de libros legales | MISSING_MODEL | No | Casilla requiere comprobación humana. |
| FCIdoneidad: libros | Libro afiliados | Ningún registro de libro legal | MISSING_MODEL | No | Tener tabla Affiliate no acredita libro legal. |
| FCIdoneidad: libros | Libros contables: Diario, Mayor, Balances e inventarios | Ninguna contabilidad/libros legales | MISSING_MODEL | No | InventoryItem no prueba existencia de libro de balances/inventarios. |
| FCIdoneidad: libros | Libro actas Junta Directiva | Ninguna | MISSING_MODEL | No | Assembly no es libro de Junta Directiva. |
| FCIdoneidad: libros | Libro tesorería | Ninguna | MISSING_MODEL | No | FinancialMovement no acredita legalización de libro. |
| FCIdoneidad: manejo fondos | Conocimiento de responsabilidad civil/penal y custodia | Ninguna certificación | MANUAL_REQUIRED | No | Ratificación de representante. |
| FCIdoneidad: manejo fondos | Destino de fondos y bienes al bienestar comunal | Ninguna certificación | MANUAL_REQUIRED | No | No inferir cumplimiento de movimientos o inventario. |
| FCIdoneidad: transferencias | Año del ejercicio presupuestario | Año indicado por declarante; reporte anual como apoyo | MANUAL_REQUIRED | Parcial | No necesariamente idéntico al año seleccionado en FIE. |
| FCIdoneidad: transferencias | No ha recibido / ha recibido fondos para plan/proyecto | Ningún financiamiento de plan asociado | MANUAL_REQUIRED | No | Dos opciones mutuamente excluyentes; cero movimientos no acredita no recepción. |
| FCIdoneidad: transferencias | Institución, hasta cuatro espacios | Ningún aportante institucional vinculado a plan | MISSING_MODEL | No | Tabla no solicita identificación del aportante. |
| FCIdoneidad: transferencias | Monto en colones por institución | Movimientos como apoyo, sin asignación por plan/institución | MISSING_MODEL | No | No sumar todo INCOME como fondos del plan. |
| FCIdoneidad: transferencias | TOTAL | Sin transferencias clasificadas por plan | MISSING_MODEL | No | DOCX no contiene fórmula; futura suma solo con filas revisadas. |
| FCIdoneidad: los cinco formularios | Ciudad de firma | Ninguna fuente de emisión | MANUAL_REQUIRED | Parcial | No asumir que es domicilio de organización o representante. |
| FCIdoneidad: los cinco formularios | Día, mes, año de firma | Fecha de firma confirmada | MANUAL_REQUIRED | Parcial | Fecha de generación no prueba fecha de firma. |
| FCIdoneidad: los cinco formularios | Firma / firma presidente | Ninguna | MANUAL_REQUIRED | No | Manual inicialmente. |
| FCIdoneidad: los cinco formularios | Sello organización | Ninguna | MANUAL_REQUIRED | No | Manual inicialmente. |
| FCIdoneidad: solicitud y transferencias | Número de Asamblea autorizante | No hay campo en estos dos formularios | NOT_APPLICABLE | No | No agregarlo por analogía con las otras tres declaraciones. |
| FCIdoneidad: solicitud y transferencias | Residencia y teléfono personal | No hay campo en estos dos formularios | NOT_APPLICABLE | No | No completar campos que no solicita el original. |

### Padrón: estructura sin contenido personal

| Documento | Campo oficial | Fuente SGI-Curime | Estado | Automatizable | Observación |
| --- | --- | --- | --- | --- | --- |
| Padrón | N° | Sin ordinal documental persistente equivalente | NOT_APPLICABLE | No | Referencia de procedencia futura, no `Affiliate.id`. |
| Padrón | 1° Apellido | `Person.firstSurname` | AVAILABLE | Parcial | Columna estructurada; requiere validación humana de lectura. |
| Padrón | 2° Apellido | `Person.secondSurname` | AVAILABLE | Parcial | Nullable; no inventar apellido cuando falte. |
| Padrón | Nombre | `Person.firstName`, `legacyFullName`; `Affiliate.fullName` | AVAILABLE | Parcial | Confirmar nombres compuestos; no separar por cantidad de espacios. |
| Padrón | Cédula | `identification`, `Person.normalizedIdentification` | AVAILABLE | Parcial | Falta tipo explícito; normalización/validación anterior al matching. |
| Padrón | Firma | Ninguna | MANUAL_REQUIRED | No | No importar, reconocer automáticamente ni almacenar en primera fase. |

## FIE vs implementación DINADECO actual

El contrato `GET /financial/reports/dinadeco/annual?year=YYYY` devuelve `{ metadata, data }`. El controlador exige `fin.dinadeco.read`; la ruta `/app/financial/dinadeco` aplica esa capability y muestra selector de año, saldos, entradas, salidas, desglose y metadata. No exporta ni representa el FIE oficial. Se contrastó el servicio y la UI sin modificarlos ni afirmar validación visual en navegador.

| Campo del contrato | Utilidad para FIE | Límite |
| --- | --- | --- |
| `year`, `currency` | Año de encabezado y montos CRC | El servicio etiqueta CRC; no ofrece conciliación contable ni selección de fondo. |
| `openingBalance` | Candidato a saldo inicial | INCOME histórico menos EXPENSE histórico antes del 1 de enero UTC; no saldo oficial certificado ni saldo inicial externo registrado. |
| `income.total`, `.count`, `.bySource` | Total entradas; conteos y apoyo al detalle | Orígenes MANUAL, RESERVATION_PAYMENT y DONATION son operativos, no cuentas oficiales. |
| `expenses.total`, `.count`, `.bySource` | Total salidas y apoyo al detalle | Incluye todo egreso registrado; no cuentas, proveedor, factura ni clasificación oficial. |
| `netMovement` | Control entradas menos salidas | No existe casilla independiente de movimiento neto en el FIE observado. |
| `closingBalance` | Candidato a saldo final | openingBalance + netMovement, no saldo segregado «en caja» ni saldo bancario conciliado. |
| `movementCount` | Control técnico de cobertura | No corresponde a quince filas ni a conteo de comprobantes del formulario. |
| `metadata` | Trazabilidad técnica | generatedAt, generatedBy, period, appliedFilters, dataSource y reportVersion no certifican firma, presidencia, tesorería ni recepción regional. |

Respuestas al contraste:

1. **Qué ya sirve:** período anual, montos Decimal serializados con dos decimales, sumas INCOME/EXPENSE, neto, conteos, procedencia por source y metadata compartida. Los pagos confirmados de reservas crean movimientos RESERVATION_PAYMENT; donaciones crean movimiento DONATION y su cancelación genera reverso EXPENSE. El FIE no debe volver a sumar Payment/Donation además del movimiento.
2. **Qué puede alimentar directamente la plantilla:** año, total de entradas y total de salidas del historial SGI. Las dos sumas de cierre de la fila 25 son derivables. openingBalance y closingBalance solo son candidatos después de validar integridad y conciliación. Las descripciones/montos de detalle existen en el listado de movimientos, no en la respuesta anual.
3. **Campos financieros faltantes:** saldo inicial oficial respaldado, discriminación de caja y banco, clasificación validada del detalle, cobertura de gastos fuera del sistema y criterios para reversos/ajustes. No hay fórmulas en FIE: C23:E25 contienen símbolos de moneda, no cálculos. No copiar resultados vacíos como cifras certificadas.
4. **Datos institucionales faltantes:** nombre legal, cédula jurídica, código DINADECO, provincia/cantón/distrito y contactos institucionales; no existe fuente institucional única.
5. **Cargos faltantes:** titular legal de presidencia y tesorería, nombramiento y vigencia. FIE no solicita la lista completa de Junta Directiva, aunque FRAG sí. Role controla acceso, no acredita cargo electo.
6. **Firmas/sellos manuales:** firmas de presidencia y tesorería, sello ADI y sello de recepción; el juramento también debe ratificarse. No usar `metadata.generatedBy` como firmante legal.
7. **Anexos sin soporte:** FIE exige expresamente copia de estado de cuenta con corte al 31 de diciembre. No existe expediente financiero de anexos. La UI menciona estados financieros adicionales cuando apliquen; el original observado no los enumera. Balance de situación, balance de comprobación y estado de resultados no están implementados y su exigibilidad para este caso queda pendiente, no se inventa como requisito del FIE.
8. **Información bancaria faltante:** banco/cuenta institucional, saldos de estado de cuenta, conciliación y relación con caja. FIE no contiene casillas de número de cuenta/banco: el requisito observado es el anexo, no nuevos campos en la plantilla.
9. **Información contable adicional:** cuentas/clasificación, folios o libros de tesorería, saldos respaldados y conciliación requieren semántica adicional. El FIE no trae columnas explícitas de cuenta o folio; no se las atribuye al original. El modelo actual es registro de movimientos, no contabilidad de doble partida ni libro legal.
10. **Agregado frente a detalle:** groupBy tipo/source pierde filas, orden y descripción. Las quince posiciones del FIE no equivalen a tres fuentes ni a movementCount. Falta acordar si se listan movimientos, conceptos agrupados o una hoja adicional y cómo resolver más de quince entradas/salidas. No se debe truncar silenciosamente ni adoptar source como clasificación oficial sin validación de la ADI.

Control futuro: totales del detalle deben cuadrar con sus totales, y entradas + saldo inicial con salidas + saldo final. Esa igualdad puede cumplirse por construcción del API aunque falten movimientos reales: no prueba suficiencia documental. El alcance UTC actual debe validarse para operaciones cerca de límites de año y la fecha operativa utilizada por la ADI; no se cambió ese comportamiento.

## Padrón histórico vs Affiliate / Person

La estructura observada es una tabla con `N°`, `1° Apellido`, `2° Apellido`, `Nombre`, `Cédula` y `Firma`. La numeración atraviesa nueve páginas hasta aproximadamente 151 registros: primera página con 17 filas, siete páginas intermedias con aproximadamente 19 filas cada una y última página con una fila. Es un conteo documental general, no 151 identidades únicas validadas ni 151 afiliados activos.

Se observa orden por ordinal de documento; no se certifica orden alfabético. Hay contenido manuscrito en la columna de firma y variaciones de alineación/inclinación del escaneo. La cuadrícula y los encabezados permiten reconocer columnas, pero no hay texto digital; la lectura fiel, integridad de cédulas y separación de nombres necesitan revisión humana. No se hizo análisis identificable de duplicados, firmas faltantes por persona o conflictos nominales. Los saltos de página y la distinta cantidad de filas por página impiden usar una cuadrícula fija sin validación.

| Campo padrón | Campo actual | Compatibilidad | Acción futura |
| --- | --- | --- | --- |
| N° | Sin correspondencia obligatoria persistente; no `Person.id`, `Affiliate.id` ni `sourceId` de manifiesto actual | No directo | Conservar página/fila/ordinal como referencia documental privada en un proceso autorizado; no usarlo como identidad global. |
| Primer apellido | `Person.firstSurname` nullable | Potencialmente compatible | Normalizar espacios y validar lectura, conservando grafía en fuente privada. |
| Segundo apellido | `Person.secondSurname` nullable | Potencialmente compatible | Validar; mantener ausencia explícita, sin completar por inferencia. |
| Nombre | `Person.firstName` nullable; `legacyFullName`; `Affiliate.fullName` obligatorio | Requiere reconciliación | Confirmar nombres compuestos; componer fullName solo desde partes revisadas. legacyFullName no es una columna exclusiva de nombre. |
| Cédula | `Person.identification`, `normalizedIdentification`, `identificationType`; `Affiliate.identification` única | Compatible después de normalización validada | Conservar como texto; confirmar tipo; matching por clave compuesta tipo + identificación normalizada. No inventar dígitos ni perder ceros. |
| Firma | No modelada | No compatible con importación inicial | Excluir captura, OCR, extracción, almacenamiento y matching por firma. |

### Person, afiliación y restricciones reales

Person representa identidad personal compartida, no afiliación ni cuenta de acceso. Sus nombres, identificación, nacimiento y contactos son nullable; la clave única es `[identificationType, normalizedIdentification]`. User y Affiliate tienen `personId` opcional y único: una Person puede tener una cuenta y una afiliación, pero no dos Affiliate enlazados. La existencia de User no acredita Affiliate. La ausencia de vínculo tampoco prueba ausencia de persona histórica: deben revisarse registros legados.

Affiliate conserva campos legados: `fullName` e `identification` obligatorios (identificación única), `birthDate` y `address` obligatorios; `email` opcional pero único. Tiene `affiliationDate` con default now y `status` con default ACTIVE. Esos defaults no prueban fecha ni estado histórico y no deben aplicarse como hechos inferidos del padrón. `roleId` es nullable expresamente para afiliados históricos cuyo rol no puede inferirse; no asignar rol arbitrario.

El padrón no aporta nacimiento, género, teléfono, correo, dirección personal, ocupación, lugar de trabajo, tipo de afiliado, fecha de afiliación, tipo de identificación explícito, rol ni estado histórico. El contacto institucional del encabezado no es contacto individual. Nacimiento y dirección bloquean una creación fiel de Affiliate con el modelo vigente; no usar fecha ficticia, cadena vacía o domicilio institucional para superar restricciones. No confundir teléfono/correo opcionales con obligatorios ni exigir completar campos que el esquema permite desconocidos.

La UI administrativa permite consultar, editar y cambiar estado de afiliados, no importar este PDF. Los contratos frontend siguen usando `Affiliate.fullName` y datos legados; Person estructurada no equivale a formulario de edición de afiliados con apellidos separados.

### normalizedIdentification e infraestructura de reconciliación

`normalizeIdentification` v1 recorta espacios externos y exige tipo NATIONAL o DIMEX y formato válido; **no elimina automáticamente guiones ni espacios internos**. NATIONAL exige nueve dígitos con inicio distinto de cero; DIMEX exige doce dígitos. El padrón no trae columna de tipo: no asignar NATIONAL a toda fila por llamarse «Cédula». Una futura normalización de formato documental deberá acordarse, versionarse y preservar el valor original de manera privada para revisión; no relajar validación ni modificar identidad silenciosamente.

IdentityReconciliationManifest existe y guarda versiones, sourceModel/sourceId, fingerprint, identificación original/normalizada, clave de cluster, clasificación, Person seleccionada, permiso de creación, códigos de conflicto, reconciliación nominal, revisión y snapshot. Su unicidad es `[normalizationVersion, decisionVersion, sourceModel, sourceId]`. Contiene PII y no es un artefacto público ni un log seguro por defecto.

La infraestructura actual acepta fuentes `User`, `Affiliate`, `UserRequest` y `AffiliateRequest`, no filas PDF. La creación/backfill seguro considera fuentes operativas User/Affiliate; una fila de padrón no puede declararse Affiliate existente para eludir esa condición. El manifiesto no dispone por sí solo de procedencia archivo/página/fila ni fuente de importación externa tipada. Reutilizar su enfoque de decisiones no significa insertar filas documentales en el manifiesto actual sin un incremento validado.

Las clasificaciones existentes incluyen IDENTITY_MATCH, IDENTITY_NOT_FOUND, IDENTITY_CONFLICT, IDENTITY_INCOMPLETE, IDENTITY_DUPLICATE y MANUAL_REVIEW_REQUIRED. Se detectan duplicados por modelo, conflictos de nacimiento/nombre/contacto/dirección, identificación original con distinto tipo y correo asociado a identidades distintas. El plan de vínculos verifica fingerprint, Person seleccionada existente, enlaces incompatibles y asignaciones múltiples. La resolución runtime valida nombres estructurados y rechaza identidad ambigua o incompatible. Estos son precedentes útiles, no un importador del padrón.

### Estrategia futura segura, sin diseño ejecutable

1. Autorizar tratamiento y establecer custodio, acceso, conservación y lote privado. Registrar procedencia archivo/página/fila/ordinal y versión de normalización; documentación pública solo con estructura y conteos.
2. Capturar exclusivamente columnas textuales autorizadas con revisión humana; excluir firmas. Conservar texto original privado, corrección propuesta y decisión; nunca contenido completo en logs.
3. Validar tipo e identificación como texto, nombres y campos incompletos. Identificación ilegible, repetida o con tipo incierto queda pendiente; no completar dígitos ni unir identidades por parecido de nombre.
4. Comparar contra Person por tipo + normalizedIdentification y contra identificaciones legadas de Affiliate/User. Un nombre distinto con misma identificación, varias filas para la misma clave o vínculos incompatibles exige revisión; distinguir repetición documental de duplicación real.
5. Si Person y Affiliate ya existen y son compatibles, conservarlos y registrar coincidencia; no crear otra afiliación ni sobrescribir perfil. Si Person existe sin Affiliate, validar la afiliación y resolver datos obligatorios ausentes antes de crearla. Si Affiliate existe sin vínculo Person, usar revisión compatible con infraestructura histórica y comprobar unicidad de vínculos.
6. Si no hay coincidencia, proponer creación pendiente de revisión. Poder almacenar una Person parcial en el esquema no autoriza crearla ni garantiza superar requisitos runtime; crear Affiliate requiere nacimiento/dirección y evidencia de afiliación, sin inventar estado, fecha o rol.
7. Resolver conflictos y duplicados con decisiones humanas auditables y comparación repetible. Una nueva ejecución debe reconocer decisiones previas y cambios de fuente, sin producir duplicados. Definir primero custodia de procedencia y política de registros parciales; no ejecutar escrituras, seeds ni importación destructiva.

## Formulario Resultado de Asamblea vs módulo Assemblies

Assembly proporciona fecha, lugar, título, type opcional, descripción, estado y configuración de cuórum. La UI administra convocados, inicio, registro PRESENT/ABSENT y finalización; backend y reportes cuentan PRESENT y distinguen ausentes, justificados y registros pendientes. Ese conteo puede alimentar afiliados presentes si la asamblea está completa y validada. COMPLETED no acredita automáticamente los resultados legales del formulario.

AssemblyConvocation contiene una fila por afiliado convocado, convenedAt y snapshot de rol; no registra autoridad convocante, convocatoria primera/segunda, elección o acta. AssemblyAttendance enlaza asamblea y Affiliate con unicidad de asistencia; Affiliate/Person aportan identidad y contacto si existen. Role y roleNameSnapshot son permisos/roles del sistema; no representan los trece espacios de cargos oficiales ni sus períodos.

Brechas para FRAG:

- Fuente institucional: región, nombre/tipo de organización, localidad, código, correspondencia, telefax y correo.
- Convocatoria legal: autoridad y ronda; fecha/lugar efectivos deben confirmarse frente a lo programado.
- Junta Directiva: nombramiento total/parcial, período, siete cargos (presidencia, vicepresidencia, secretaría, tesorería y tres vocalías), Fiscalía y suplencias con cantidades según estatuto. Identidad disponible no equivale a designación registrada.
- Reforma estatutaria: decisión Sí/No, artículos, evidencia y seguimiento de publicación. El formulario contiene una nota sobre retiro del aviso y publicación; no existe workflow de ese trámite.
- Plan de Trabajo: documento y resolución de aprobación; no equivalen a description.
- Acta y expediente: mínimo dos copias del acta y formulario, sin infraestructura específica observada. Los adjuntos de justificación de ausencia pertenecen a otra finalidad y no sustituyen actas o expediente institucional.
- Manual inicial: fecha/ciudad de emisión cuando corresponda, selección/confirmación de resultados y firmantes, firmas presidencia/secretaría, sello y recepción DINADECO.

## Liquidaciones de fondos

### Campos comunes

Ambos originales comparten organización, cédula jurídica, registro, región y geografía; fecha de entrega y monto otorgado; diez gastos con proveedor/origen, factura o comprobante (número, fecha y monto), acuerdo (acta, acuerdo y sesión), medio de pago (transferencia o cheque, emisión y monto); dos totales, remanente, juramento, presidencia/tesorería e identidades, firmas y recepción regional con fecha/hora/sello.

### Campos específicos

Solo cambia el título y nombre de hoja que identifican Fondo por Girar frente a Impuesto al Cemento. No se observaron columnas o declaraciones funcionales distintas. El nombre de archivo FLFGirarISR y la solicitud de idoneidad aportan contexto de ISR, pero el título de esta liquidación no incorpora porcentaje ni un campo fiscal adicional; no inventar tasa, elegibilidad, restricciones o calendario.

### Datos financieros existentes

FinancialMovement dispone de descripción, referencia libre, occurredAt, monto y tipo. Puede ayudar a localizar egresos e ingresos, pero no identifica la entrega de recursos ni imputa gastos a un fondo. Payment modela cobros de cargos por reservas, con método/referencia/paidAt; no es registro de pagos salientes a proveedores. `source = MANUAL` no indica Fondo por Girar o Cemento. Usar el reporte anual completo como liquidación de un fondo mezclaría recursos distintos.

### Datos faltantes

Asignación/entrega de un fondo, origen y alcance del recurso, monto otorgado, gasto imputado, relación entre factura y pago, total efectivamente liquidado y remanente validado. No hay diferencia contable explícita entre originales: ambos piden colones y separan monto de factura de monto del medio de pago. Las reglas particulares por origen quedan pendientes de validación; igualdad de layout no demuestra igualdad normativa.

### Datos documentales faltantes

Proveedor, factura/comprobante y fecha, acta/acuerdo de pago/sesión, pago saliente por transferencia o cheque y emisión, evidencia documental, plan de trabajo aprobado/presentado y representación vigente. `reference` libre no acredita tipo/documento ni vincula acta. La matriz no considera estas coincidencias de texto como soporte completo.

Fórmulas originales, idénticas en ambos archivos:

| Celda | Fórmula observada | Evaluación para futura integración |
| --- | --- | --- |
| K26 | `=SUM(K16:L25)` | Total de montos de factura; incluye rango de columnas combinadas. |
| W26 | `=SUM(W16:X25)` | Total de montos del medio de pago, distinto concepto. |
| D29 | `=S11-D26` | Referencias incongruentes: S11 pertenece al rango combinado N11:X11 con etiqueta del monto; D26 al rango B26:D26 con «Total:». Ninguna referencia señala las fórmulas K26/W26. |

El remanente no debe reutilizarse a ciegas ni corregirse en el original durante este incremento. Confirmar con ADI la casilla de captura del monto otorgado y si la resta usa facturas, pagos efectivamente liquidados u otro valor. Ambas hojas mezclan etiquetas y espacios de captura en celdas combinadas: fijar un contrato de captura posterior a esa validación. No se observan otros anexos enumerados ni sello separado de ADI en estos originales; el respaldo de factura está en el detalle, sin instrucción textual específica de anexar copias.

### Posible abstracción futura

La coincidencia de campos justifica evaluar una liquidación común con `fundType` o concepto equivalente que distinga los dos orígenes. Conceptualmente, Fund describe origen; FundAllocation la entrega y monto; FundExpense la imputación del gasto; SupportingDocument su factura/comprobante/acta. Son nombres ilustrativos justificados por campos reales, no diseños aceptados, esquemas Prisma ni nuevas entidades propuestas para implementación inmediata.

Primero validar remanente, significado de «origen del gasto», relación factura/pago y expansión más allá de diez filas. Después evaluar cuánto puede reutilizarse del registro financiero sin duplicarlo. No hay evidencia para diseñar ahora contabilidad completa ni reglas tributarias por tipo de fondo.

## Idoneidad y declaraciones juradas

### 1. Solicitud de Calificación de Idoneidad

Dirigida a miembros del Consejo Nacional de Desarrollo de la Comunidad. Pide presidente solicitante e identificación, nombre completo de Asociación de Desarrollo Integral como en cédula jurídica y cédula jurídica. Expresa solicitud para percibir recursos públicos del equivalente al 2 % ISR, verificados requisitos del Fondo por Girar/Fondo de Proyectos según corresponda. Pide ciudad, día/mes/año, firma y sello.

No contiene casillas de Asamblea, teléfono/residencia, montos individuales, libros ni checklist. Person/Affiliate permiten apoyar identidad seleccionada, pero falta organización legal, representación vigente y expediente de solicitud/requisitos. La declaración, fecha de firma, firma y sello permanecen manuales. La referencia al decreto es texto del original, no una validación legal implementada.

### 2. Declaración jurada sobre utilización de reglamentos, manuales, instructivos o directrices

Pide presidente, identidad, residencia, teléfono, organización y cédula jurídica; autorización por Asamblea General número y fecha. Declara veracidad, administración adecuada y mecanismos de control mediante esos instrumentos. Es declaración narrativa, no lista con casillas por reglamento. Termina con ciudad/fecha, firma presidente y sello.

Identidad/domicilio/contacto pueden reutilizarse con revisión; Assembly.date puede servir de contexto, pero faltan número oficial, resolución autorizante y enlace a evidencia. Faltan representación, perfil institucional y registro/evidencia de controles. No marcar «cumple» por existir roles o auditoría; ratificación manual.

### 3. Declaración jurada sobre utilización de libros legales

Comparte representante, identidad, residencia/teléfono, organización/cédula jurídica y Asamblea autorizante/número/fecha. Tiene cinco casillas: actas de Asambleas Generales; afiliados; libros contables (Diario, Mayor, Balances e inventarios); actas de Junta Directiva; tesorería. Pide ciudad/fecha, firma y sello.

Los módulos actuales de asambleas, afiliados, movimientos e inventario no acreditan existencia, legalización o utilización de esos libros. Falta registro institucional/evidencia; casillas y juramento requieren comprobación humana. No crear automáticamente un checklist verdadero a partir de tablas de base de datos.

### 4. Declaración jurada sobre manejo de fondos públicos

Comparte identidad, residencia/teléfono, organización/cédula jurídica y Asamblea que autoriza. Declara conocimiento de responsabilidades civiles/penales y custodia de fondos otorgados por el Consejo, así como destino de fondos y bienes al bienestar comunal y no al beneficio personal. Pide ciudad/fecha, firma y sello.

No pide listado de instituciones/montos ni año presupuestario independiente. Son declaraciones personales que SGI no puede certificar mediante movimientos. Falta evidencia de autorización y representación; las afirmaciones, firma y sello permanecen manuales.

### 5. Declaración jurada sobre transferencias de recursos para ejecución del plan de trabajo

Pide presidente e identidad, organización/cédula jurídica y año presupuestario. Ofrece dos opciones: no recepción de fondos de institución estatal para este plan, o recepción de fondos de instituciones estatales, privadas u organismos internacionales para este proyecto. La alternancia textual «plan de trabajo» / «proyecto» debe confirmarse, sin reinterpretación automática. Hay cuatro espacios Institución/Monto en colones y una fila TOTAL; no existen fórmulas de cálculo en DOCX. Pide ciudad/fecha, firma y sello.

No contiene la referencia de Asamblea/residencia/teléfono de las otras tres declaraciones. Faltan financiamiento por institución vinculado al plan/proyecto, año y evidencia, no basta sumar ingresos anuales o donaciones por nombre de donante. Opciones, completitud del listado y juramento requieren revisión. No se observó bloque separado de recepción DINADECO en este documento.

## Datos institucionales de la organización

No se encontró en el esquema Prisma actual un modelo único de organización legal, Junta Directiva o período de representación. Textos institucionales del frontend no son una fuente persistida y validada de esos datos. Person es identidad individual, Role es autorización y Assembly es evento de reunión.

| Dato institucional requerido | Estado actual | Evidencia / límite |
| --- | --- | --- |
| Nombre legal | MISSING_MODEL | No existe organización legal persistida. |
| Cédula jurídica | MISSING_MODEL | Person/User/Affiliate almacenan identificación individual. |
| Código registro DINADECO | MISSING_MODEL | No hay campo institucional. |
| Región | MISSING_MODEL | No hay jurisdicción regional institucional. |
| Provincia | MISSING_MODEL | Sin geografía de organización estructurada. |
| Cantón | MISSING_MODEL | Mismo límite. |
| Distrito | MISSING_MODEL | Mismo límite. |
| Dirección de organización/correspondencia | MISSING_MODEL | Direcciones de Person/Affiliate no son dirección institucional. |
| Teléfono / telefax | MISSING_MODEL | Contactos personales no son contactos institucionales. |
| Correo | MISSING_MODEL | Correo de cuenta o persona no es fuente legal de organización. |
| Junta Directiva vigente | MISSING_MODEL | Sin designaciones, posiciones o vigencias. |
| Presidente | MISSING_MODEL | Personas existentes pueden ser candidatos; no hay titular legal registrado. |
| Tesorero | MISSING_MODEL | Role Tesorero no acredita titular legal. |
| Período Junta Directiva | MISSING_MODEL | No existe mandato institucional. |
| Integral / Específica y localidad | MISSING_MODEL | Requerido por FRAG, sin clasificación institucional. |

Esta brecha compartida afecta FIE, ambas liquidaciones, FRAG y los cinco formularios de idoneidad. No se creó un modelo ni se fijó un catálogo de cargos/regiones; la validación institucional debe preceder a su diseño.

## Pendientes de interpretación y follow-ups documentales

- FIE: etiqueta truncada de cédula jurídica, presentación de detalle y expansión de quince filas, saldo «en caja» frente al agregado, saldo inicial oficial y anexo bancario.
- Liquidaciones: significado de origen del gasto, casilla de monto otorgado y fórmula de remanente, total base para liquidar, vínculo factura/pago/acuerdo y expansión de diez filas.
- FRAG: fecha de formulario versus celebración efectiva, tipo de Asamblea libre, ronda y autoridad convocante, período/designaciones y cantidad de fiscales/suplencias según estatuto.
- Idoneidad: evidencia de autorización, libros/controles, alternancia plan/proyecto, cumplimiento de requisitos por fondo y capturas de instituciones cuando superen cuatro filas. No interpretar referencias normativas como requisitos técnicos nuevos.
- Padrón: unicidad real, lecturas dudosas, tipo de identificación, campos obligatorios faltantes, fecha/estado de afiliación y procedencia; no se resolvieron identidades en este incremento.
- Follow-up objetivo, sin modificar `docs/modules/financial.md`: su sección final declara pendientes la integración automática de donaciones y la generación de movimientos RESERVATION_PAYMENT por pagos. En esta base, `DonationsService.create/cancel` y `FinancialService.recordPayment` ya crean esos movimientos. El documento de Afiliados no presentó una contradicción objetiva necesaria para este análisis. La revisión no se extiende a corregir el resto del índice documental.

## Tratamiento de documentos privados

Los originales **NO deben versionarse**. `private-reference/` es una referencia privada local y no forma parte del repositorio versionado; su exclusión en `.git/info/exclude` no se distribuye a otros clones. Cada entorno que reciba originales debe verificar su exclusión antes de trabajar. En la revisión inicial los seis archivos estaban ignorados, `git ls-files private-reference` estaba vacío y el worktree estaba limpio.

El padrón contiene PII; identificaciones, nombres y firmas no se reproducen en esta documentación. Las firmas constituyen información sensible: no extraerlas, reconocerlas mediante OCR ni almacenarlas en la primera fase. Cédulas reales no deben aparecer en ejemplos, fixtures, seeds o tests; los tests futuros deben usar personas y datos ficticios, sin derivarlos de originales.

Cualquier carga futura requiere autorización y definición de acceso/custodia. Documentos completos, imágenes, snapshots identificables y filas del padrón no deben escribirse en logs. La auditoría debe registrar acciones, actor autorizado, lote/decisión y metadatos mínimos; no nombres, identificaciones, firmas ni contenido completo. Un manifiesto privado que incluya PII requiere controles propios y no puede confundirse con auditoría pública.

Una futura importación necesita validación, preflight y revisión humana, preservación de origen y control de repeticiones. No debe existir importación destructiva automática, sobreescritura silenciosa, creación masiva sin revisión o asignación de fechas/estados/roles por defecto como si fueran historia acreditada. Este incremento no importó registros, no creó seeds y no cargó documentos a producción.

## Backlog derivado

Las prioridades combinan obligación operativa descrita por la ADI, reutilización del sistema actual y validación del formulario antes de introducir modelos grandes. Deben confirmarse fechas de trámites con la ADI; no se inventan vencimientos. Los siguientes incrementos son recomendaciones, no autorización de implementación.

### DINADECO / Informe Económico

- Estado actual: **parcialmente soportado**; agregación anual y UI implementadas, formulario oficial faltante.
- Dependencias: validar detalle/quince filas, saldos oficiales/caja/banco, contacto institucional, representantes y anexo bancario.
- Riesgo: alto si se presenta agregado incompleto como declaración oficial o se duplica Payment/Donation.
- Prioridad sugerida: **alta, primera**. FinancialMovement, DINADECO Fase 1 y metadata ya cubren parte importante de los importes, y el FIE es obligación operativa prioritaria indicada por la ADI.
- Siguiente incremento recomendado: validación funcional de un FIE ficticio con ADI, reglas de detalle y conciliación y contrato de captura mínima para datos institucionales/representantes/anexos; acotar después la preparación del formulario sin rediseñar todo el financiero.

### Liquidación Fondo por Girar

- Estado actual: **faltante** como liquidación oficial; registro financiero reutilizable parcialmente.
- Dependencias: validar fórmula/remanente, entrega/asignación, imputación, comprobantes, acuerdo/pago saliente y plan aprobado.
- Riesgo: alto por mezclar orígenes, sumar facturas/pagos incorrectamente o reutilizar fórmula defectuosa.
- Prioridad sugerida: **alta después de validar FIE y brechas institucionales**, condicionada al trámite real de recursos.
- Siguiente incremento recomendado: levantar un caso ficticio completo de entrega a liquidación y resolver pendientes de las diez filas antes de diseñar persistencia.

### Liquidación Impuesto al Cemento

- Estado actual: **faltante** como liquidación oficial; misma base reutilizable de movimientos.
- Dependencias: mismas de Fondo por Girar y confirmación de reglas específicas por origen.
- Riesgo: alto por mezclar fondos o asumir igualdad normativa solo por layout.
- Prioridad sugerida: **media-alta**, analizar junto con Fondo por Girar para reducir duplicación; ordenar por obligación efectiva de ADI.
- Siguiente incremento recomendado: validar segundo caso ficticio y decidir si la liquidación común admite ambos orígenes sin introducir contabilidad general.

### Resultado de Asamblea

- Estado actual: **parcialmente soportado**; fecha/lugar/type y asistencia disponibles, resultados legales faltantes.
- Dependencias: organización, autoridad/ronda de convocatoria, acta legal, nombramientos/vigencias, estatuto y plan/aprobación.
- Riesgo: alto al equiparar permisos con cargos electos o COMPLETED con decisiones aprobadas.
- Prioridad sugerida: **media-alta**, según próxima Asamblea y trámites; representación institucional puede ser dependencia temprana de FIE.
- Siguiente incremento recomendado: validar resultados y evidencia de una Asamblea ficticia; delimitar registro de nombramientos separado de Role, sin cambiar permisos.

### Idoneidad

- Estado actual: **faltante** como expediente y formularios; identidad/contactos reutilizables parcialmente.
- Dependencias: organización/representante, autorización legal, evidencias de controles/libros y financiamiento por plan/institución.
- Riesgo: alto por certificar controles o declaraciones sin prueba y por tratar ausencia de movimientos como ausencia de fondos.
- Prioridad sugerida: **media**, elevar si condiciona la obtención de recursos; reutilizar organización y representación validadas.
- Siguiente incremento recomendado: validar los cinco formularios y checklist de evidencias humanas, distinguiendo controles reales de funcionalidades SGI; no generar todavía declaraciones automáticamente.

### Padrón / Migración de afiliados

- Estado actual: **faltante** para importar padrón; Person, Affiliate y reconciliación interna existentes.
- Dependencias: autorización, procedencia privada, captura revisada, normalización versionada, matching, política de parciales y resolución de nacimiento/dirección/fecha/estado.
- Riesgo: **muy alto** por PII, firmas, duplicados y creación de historia falsa mediante defaults.
- Prioridad sugerida: **media para levantamiento/preflight privado; importación posterior** a resolver integridad y revisión humana. No convertir el conteo documental en objetivo de creación masiva.
- Siguiente incremento recomendado: definir procedimiento autorizado de revisión y reconciliación sin escrituras, con ejemplos ficticios y reglas de decisión; evaluar limitaciones de fuentes actuales del manifiesto antes de diseñar un importador.
