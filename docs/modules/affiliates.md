# Módulo de Afiliados

Estado: Vigente  
Última revisión: 2026-09  
Fuente primaria: código actual de `main`, pruebas y configuración vigente

## Propósito

El módulo de Afiliados permite consultar, actualizar y cambiar el estado de las personas afiliadas registradas en SGI-Curime.

## Alcance implementado

Actualmente el sistema soporta:

- listado paginado de afiliados;
- búsqueda por nombre, identificación, correo o término general;
- filtro por estado;
- consulta de detalle;
- edición de datos del afiliado;
- activación y desactivación;
- validación de identificación;
- validación de teléfono;
- detección de duplicados de identificación y correo;
- registro de auditoría para actualización y cambios de estado.

La creación directa de afiliados mediante un endpoint `POST /affiliates` no forma parte del flujo implementado actualmente.

## Arquitectura

### Backend

La vertical principal vive en:

```text
backend/src/affiliates/
├── dto/
├── affiliates.controller.ts
├── affiliates.module.ts
├── affiliates.service.ts
└── pruebas asociadas
```

Flujo principal:

```text
HTTP Controller
    ↓
AffiliatesService
    ↓
PrismaService
    ↓
PostgreSQL
```

El servicio también integra validaciones compartidas y auditoría.

### Frontend

La vertical vive bajo:

```text
frontend/src/features/affiliates/
├── api/
├── hooks/
├── model/
├── ui/
└── index.ts
```

El frontend utiliza el cliente HTTP compartido y tipos propios de la vertical.

## Estados

El contrato frontend reconoce:

```text
ACTIVE
INACTIVE
```

Las operaciones de activación y desactivación rechazan transiciones redundantes. Por ejemplo, intentar activar un afiliado que ya está activo produce conflicto.

## Datos principales

Un afiliado incluye, entre otros:

- nombre completo;
- identificación;
- tipo de identificación;
- fecha de nacimiento;
- género;
- teléfono descompuesto en código de país y número nacional;
- teléfono normalizado/legado cuando aplica;
- correo;
- dirección;
- ocupación;
- lugar de trabajo;
- tipo de afiliado;
- fecha de afiliación;
- estado.

## Búsqueda y paginación

El listado permite filtrar por:

- `name`;
- `identification`;
- `status`;
- `search`;
- `page`;
- `limit`.

`search` consulta de forma insensible a mayúsculas/minúsculas sobre nombre, identificación y correo.

La respuesta sigue el patrón paginado:

```text
{
  data,
  total,
  page,
  limit
}
```

## Validaciones de actualización

Cuando se modifica identificación o su tipo, el servicio valida que ambos sean compatibles.

Tipos observados en el contrato frontend:

```text
NATIONAL
DIMEX
```

Cuando se modifica teléfono, se valida la combinación de código de país y número nacional.

Si se modifica identificación o correo, el servicio verifica que no pertenezcan a otro afiliado.

## Endpoints vigentes

| Método | Ruta | Protección actual backend | Propósito |
| --- | --- | --- | --- |
| GET | `/affiliates` | JWT + rol `Administrador` | Listar afiliados |
| GET | `/affiliates/:id` | JWT + rol `Administrador` | Obtener detalle |
| PATCH | `/affiliates/:id` | JWT + rol `Administrador` | Editar afiliado |
| PATCH | `/affiliates/:id/activate` | JWT + rol `Administrador` | Activar |
| PATCH | `/affiliates/:id/deactivate` | JWT + rol `Administrador` | Desactivar |

## Ruta frontend y autorización

El ERP expone la administración de afiliados mediante:

```text
/app/admin/affiliates
```

La ruta frontend utiliza la capability:

```text
adm.affiliates.read
```

### Estado de reconciliación de autorización

Existe una diferencia entre capas que debe considerarse deuda técnica vigente:

```text
Frontend
adm.affiliates.read

Backend
RolesGuard + Administrador
```

Por tanto, la autorización de Afiliados todavía no está completamente unificada bajo capabilities de extremo a extremo. No debe documentarse como una migración terminada hasta que el backend adopte el mismo contrato o se tome otra decisión explícita.

## Auditoría

Las operaciones de escritura generan eventos de auditoría.

### Actualización

Acción:

```text
AFFILIATE_UPDATED
```

Módulo:

```text
AFFILIATES
```

El detalle registra los nombres de los campos modificados, no los valores completos.

### Cambio de estado

Acciones:

```text
AFFILIATE_ACTIVATED
AFFILIATE_DEACTIVATED
```

Los eventos pueden incluir contexto de IP y user-agent recibido desde el request.

## Integración con solicitudes de afiliación

El repositorio también contiene una vertical separada de solicitudes de afiliación (`affiliate-requests`). Este documento describe únicamente el agregado administrativo de afiliados ya existentes.

Las solicitudes y su aprobación deben documentarse por separado o vincularse explícitamente cuando se consolide ese flujo.

## Pruebas relevantes

La vertical dispone de pruebas frontend y backend alrededor del golden path administrativo. Deben seguir cubriendo como mínimo:

- listado y paginación;
- filtros;
- detalle inexistente;
- edición;
- identificación inválida;
- teléfono inválido;
- duplicados;
- activación y desactivación;
- invalidación de caché frontend;
- eventos de auditoría asociados.

## Limitaciones y trabajo futuro

No debe asumirse que estén implementados:

- creación administrativa directa de afiliados mediante `POST /affiliates`;
- unificación completa backend/frontend por capabilities;
- historial completo de cambios del afiliado expuesto en la UI;
- eliminación física de afiliados.

## Fuentes relacionadas

- `backend/src/affiliates/`
- `frontend/src/features/affiliates/`
- `backend/src/common/validation/identity-contact.validation.ts`
- `backend/src/audit/`
- `docs/modules/audit.md`
- `docs/architecture/backend-as-is.md`
- `docs/architecture/frontend-as-is.md`
