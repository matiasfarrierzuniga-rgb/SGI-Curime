# Proposal

## Why

Las solicitudes de afiliación conservan únicamente una dirección descriptiva y pueden aprobarse sin evidencia territorial estructurada ni referencia al acuerdo institucional que resuelve la admisión. SGI-Curime necesita preservar residencia declarada como evidencia separada y preparar una futura revisión territorial trazable. El responsable confirmó funcionalmente el alcance Curime, distrito Nicoya, cantón Nicoya, provincia Guanacaste; falta respaldo estatutario documental antes de activarlo como política.

## What Changes

- Ampliar de forma aditiva la solicitud pública para recibir códigos territoriales oficiales cuando correspondan, comunidad/localidad declarada y dirección descriptiva.
- Preservar la residencia enviada como snapshot inmutable de `AffiliateRequest`, separado del domicilio institucional y de los datos personales actuales de `Person`.
- Preparar, pero no activar, una revisión territorial administrativa explícita: resultado, evidencia mínima, versión de política y trazabilidad del usuario autorizado.
- Separar la captura/snapshot territorial implementable de la decisión definitiva de elegibilidad, que solo podrá activarse con política de cobertura respaldada; seleccionar «Curime» nunca aprobará ni verificará automáticamente una solicitud.
- Registrar la cobertura funcional confirmada como una única localidad: Curime → distrito Nicoya → cantón Nicoya → provincia Guanacaste. Usar el catálogo oficial de localidades INEC como fuente candidata para el futuro filtro jerárquico, sujeto a certificación de fuente, versión e integridad.
- Preparar referencia al acuerdo de Junta Directiva que resuelve admisión o denegación, diferenciada del usuario autorizado que registra la operación. No introducir dependencia con Asambleas: el modelo actual solo puede aportar contexto opcional, no acreditar acuerdo de Junta.
- Cerrar A.7–A.8 como diseño de contratos: revisión territorial append-only para solicitudes `PENDING`, versionado y conflictos, respuestas protegidas, y una envolvente técnica de referencia de acuerdo de Junta. Esta preparación no crea endpoint, tabla, migración, acción UI ni gate terminal.
- Preservar los endpoints y estados `PENDING | APPROVED | REJECTED`; extender sus DTO y respuestas de forma compatible antes de implementar consumidores.
- Preservar Person First, campos `submitted*`, creación backend-owned de `Affiliate`, transacciones serializables, compare-and-set, rechazo motivado y auditoría atómica.
- Tratar solicitudes históricas sin datos territoriales como evidencia incompleta que requiere revisión manual; no inferir códigos ni residencia desde `address`.
- Mantener la autorización actual durante V1; Secretaría es responsabilidad operativa propuesta, no un nuevo Role, capability ni derivación automática desde cargos institucionales.
- Mantener INEC localidades como fuente candidata prioritaria; no validar ni interpretar códigos como oficiales hasta certificar endpoint/distribución, licencia, versión, integridad y operación. Caché o artefacto local versionado siguen siendo decisiones técnicas posteriores.
- Permitir únicamente un incremento técnico mínimo aditivo de captura/snapshot, tras autorización explícita de Apply y contratos de privacidad/compatibilidad. Mantener bloqueada la activación de elegibilidad, el gate de aprobación y el registro estructurado del acuerdo hasta resolver evidencia institucional y legal.

## Capabilities

### New Capabilities
- `affiliation-territorial-eligibility`: Captura evidencia territorial declarada y conserva su snapshot; prepara una futura revisión administrativa contra una política de cobertura respaldada.

### Modified Capabilities
- `affiliate-requests`: Extiende el flujo público y administrativo para mostrar evidencia territorial; deja condicionado el gate de aprobación y la referencia de acuerdo institucional a decisiones pendientes.

## Impact

- Persistencia: futura expansión Prisma aditiva de `AffiliateRequest`; no se proponen tablas relacionales de provincia, cantón o distrito en V1.
- Backend: incremento mínimo futuro limitado a DTO público y proyecciones compatibles de snapshot. Revisión territorial, políticas y contratos terminales permanecen pendientes; validación autoritativa y auditoría siguen en servidor.
- Contratos futuros: el diseño reserva un recurso protegido de evidencia de revisión, pero `approve` y `reject` conservan exactamente sus rutas, payloads y comportamiento actuales hasta un Apply terminal separado.
- Frontend: formulario público `/afiliacion` y detalle/revisión en `/app/admin/requests`, manteniendo arquitectura y contratos existentes.
- Datos históricos: filas existentes permanecen válidas y sin backfill inferido; su residencia territorial queda incompleta hasta revisión deliberada.
- Fuentes externas: catálogo oficial de localidades INEC es candidato para identificar Curime y alimentar filtros futuros; no está certificado ni activo. El incremento mínimo no depende de consulta remota ni afirma validez oficial de códigos.
- Autorización: no cambia la matriz RBAC general, Roles ni capabilities en este incremento.
- Trazabilidad V2: CU-04 y CU-05 son referencias relacionadas, pero el catálogo inmutable no está incorporado; estado `NOT_VERIFIED`.
- Fuera de alcance: `UserRequest`, Eventos, Perfil institucional, importación, OCR, conciliación o análisis del padrón, RBAC transversal, geocodificación, coordenadas exactas, catálogo geográfico nacional completo y modificación automática de `Person.address`.
