# Módulo de Auditoría

Estado: Vigente  
Última revisión: 2026-09  
Fuente primaria: código actual de `main`, pruebas y configuración vigente

## Propósito

El módulo de Auditoría registra acciones relevantes ejecutadas dentro de SGI-Curime y permite su consulta administrativa.

Su objetivo es aportar trazabilidad sobre cambios sensibles y operaciones de negocio sin exponer secretos ni depender de logs de infraestructura.

## Alcance implementado

Actualmente el sistema soporta:

- creación de registros de auditoría desde otros módulos;
- asociación opcional con usuario;
- registro de acción, módulo, tipo de entidad e identificador;
- contexto opcional de IP y user-agent;
- almacenamiento de detalles adicionales sanitizados;
- listado paginado;
- filtros por usuario, acción, módulo y rango temporal;
- consulta de detalle;
- inclusión de datos resumidos del usuario asociado.

## Arquitectura

La vertical vive en:

```text
backend/src/audit/
├── audit-actions.ts
├── audit.controller.ts
├── audit.module.ts
├── audit.service.ts
├── dto/
└── pruebas asociadas
```

Flujo de escritura típico:

```text
Módulo de negocio
      ↓
AuditService.log(...)
      ↓
Prisma AuditLog
      ↓
PostgreSQL
```

Flujo de consulta:

```text
GET /audit-logs
      ↓
AuditController
      ↓
AuditService.findAll/findOne
      ↓
PostgreSQL
```

## Modelo lógico del evento

Un evento de auditoría puede contener:

- `userId`;
- `action`;
- `module`;
- `entityType`;
- `entityId`;
- `details`;
- `ipAddress`;
- `userAgent`.

`entityId` se serializa como texto para permitir registrar entidades con distintos tipos de identificador.

## Sanitización de datos sensibles

Antes de persistir `details`, el módulo aplica sanitización recursiva.

Las claves sensibles se detectan mediante un patrón que cubre términos como:

```text
password
token
jwt
secret
database_url
admin_password
```

Estas claves son excluidas de los detalles almacenados.

La sanitización también:

- descarta valores no serializables;
- convierte `bigint` a texto;
- convierte fechas válidas a ISO;
- evita ciclos de objetos;
- conserva arrays y objetos con valores seguros.

La auditoría no debe utilizarse para almacenar secretos, contraseñas, tokens o dumps arbitrarios del request.

## Consultas

El listado admite filtros por:

- `userId`;
- `action`;
- `module`;
- `dateFrom`;
- `dateTo`;
- `page`;
- `limit`.

La respuesta es paginada:

```text
{
  data,
  total,
  page,
  limit
}
```

Los resultados se ordenan por `createdAt` descendente.

## Endpoints vigentes

| Método | Ruta | Protección actual backend | Propósito |
| --- | --- | --- | --- |
| GET | `/audit-logs` | JWT + rol `Administrador` | Listar eventos |
| GET | `/audit-logs/:id` | JWT + rol `Administrador` | Obtener detalle |

## Ruta frontend y autorización

El ERP expone la vista de auditoría en:

```text
/admin/audit-logs
```

La ruta frontend está protegida con la capability:

```text
aud.logs.read
```

### Estado de reconciliación de autorización

Actualmente existe una diferencia entre frontend y backend:

```text
Frontend
RoleRoute capability="aud.logs.read"

Backend
RolesGuard + Administrador
```

Por tanto, la migración de Auditoría hacia capabilities de extremo a extremo no está completamente terminada.

La documentación vigente debe reflejar esta diferencia hasta que ambas capas adopten el mismo contrato de autorización.

## Integración con otros módulos

Auditoría es una capacidad transversal. Algunos módulos actuales ya la utilizan explícitamente.

### Afiliados

Se registran acciones como:

```text
AFFILIATE_UPDATED
AFFILIATE_ACTIVATED
AFFILIATE_DEACTIVATED
```

### Financiero

Los movimientos financieros manuales registran:

```text
FINANCIAL_MOVEMENT_CREATED
```

con información resumida del movimiento y contexto del request cuando está disponible.

Otros dominios también pueden utilizar `AuditService`; la lista exacta de acciones vigentes debe consultarse en `backend/src/audit/audit-actions.ts` y en sus consumidores.

## Responsabilidades y límites

Auditoría debe registrar hechos relevantes de negocio, no convertirse en un log general de aplicación.

Ejemplos adecuados:

- cambio de estado de una entidad;
- edición administrativa relevante;
- creación de movimientos financieros;
- operaciones privilegiadas.

Ejemplos que no deberían persistirse como `details` sin tratamiento:

- contraseñas;
- JWT;
- tokens de recuperación;
- secretos de configuración;
- cuerpos completos de requests con datos sensibles.

## Relación con seguridad

La auditoría mejora trazabilidad, pero no sustituye:

- autorización;
- autenticación;
- control de acceso;
- backups;
- logging de infraestructura;
- observabilidad técnica.

Debe considerarse una capa adicional para registrar acciones relevantes del dominio.

## Pruebas relevantes

Las pruebas deben mantener cobertura sobre:

- creación de logs;
- sanitización recursiva;
- eliminación de claves sensibles;
- manejo de fechas y valores especiales;
- filtros;
- paginación;
- detalle inexistente;
- asociación segura con usuario.

## Limitaciones y trabajo futuro

No debe asumirse que estén implementados:

- exportación formal de auditoría;
- retención configurable;
- archivado histórico;
- firma o inmutabilidad criptográfica;
- dashboards avanzados de auditoría;
- autorización backend completamente basada en capabilities.

## Fuentes relacionadas

- `backend/src/audit/`
- `frontend/src/pages/admin/AuditLogsPage.tsx`
- `frontend/src/app/router/AppRoutes.tsx`
- `docs/modules/affiliates.md`
- `docs/modules/financial.md`
- `docs/architecture/backend-as-is.md`
- `docs/architecture/frontend-as-is.md`
