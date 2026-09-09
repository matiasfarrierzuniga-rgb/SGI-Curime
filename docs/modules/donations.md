# Módulo de Donaciones

Estado: Vigente como documentación de estado actual  
Última revisión: 2026-09  
Fuente primaria: código actual de `main`, esquema Prisma y configuración del frontend

## Propósito

Este documento describe el estado real de Donaciones en SGI-Curime. Actualmente Donaciones forma parte del alcance funcional previsto del sistema, pero no existe todavía como módulo funcional completo en `main`.

## Estado actual

A septiembre de 2026:

- no existe una vertical backend `backend/src/donations/`;
- no existe una vertical frontend `frontend/src/features/donations/`;
- no existe un modelo Prisma `Donation`;
- no existen endpoints HTTP específicos de Donaciones;
- no existe una ruta ERP específica de Donaciones;
- no existe un flujo habilitado en el sitio público para registrar donaciones.

Por tanto, Donaciones debe considerarse **planificado / no implementado** y no un módulo funcional terminado.

## Preparación ya existente

Aunque no existe el módulo funcional, el sistema contiene dos puntos de preparación relevantes.

### 1. Integración prevista con Financiero

El enum `FinancialMovementSource` incluye:

```text
MANUAL
RESERVATION_PAYMENT
DONATION
```

Esto reserva `DONATION` como posible origen de un movimiento financiero futuro.

La presencia del enum no implica que exista todavía lógica de negocio que cree movimientos desde Donaciones.

### 2. Sitio público

`frontend/src/content/publicSiteContent.ts` contiene el servicio "Donaciones", pero su disponibilidad está deshabilitada:

```text
donations: { enabled: false }
```

Esto indica que la UI pública reconoce Donaciones como capacidad futura, pero no la expone como flujo operativo.

## Arquitectura esperada cuando se implemente

La implementación futura debería respetar la arquitectura vigente del proyecto.

### Backend

Dirección esperada:

```text
backend/src/donations/
├── dto/
├── donations.controller.ts
├── donations.module.ts
├── donations.service.ts
└── pruebas
```

### Frontend

Dirección esperada:

```text
frontend/src/features/donations/
├── api/
├── hooks/
├── model/
├── ui/
└── index.ts
```

Esto es una guía de alineación arquitectónica, no evidencia de implementación existente.

## Integración futura con Financiero

Si Donaciones crea movimientos contables, la integración deberá definir explícitamente:

```text
Donación registrada
      ↓
FinancialMovement
source = DONATION
```

Antes de implementar ese flujo deben quedar definidas al menos:

- relación entre donación y movimiento financiero;
- identidad del donante o anonimato permitido;
- moneda soportada;
- método de recepción;
- referencia/comprobante;
- estado o reversión de una donación;
- auditoría;
- capabilities;
- reglas de privacidad de datos del donante.

## No inferir del estado actual

No debe asumirse que existen actualmente:

- creación de donaciones;
- listado de donaciones;
- detalle de donación;
- recibos;
- comprobantes adjuntos;
- campañas o proyectos receptores;
- donaciones recurrentes;
- integración bancaria o SINPE;
- generación automática de movimientos financieros;
- endpoints públicos de donación.

## Criterio para considerar el módulo implementado

Donaciones podrá pasar de "planificado" a "implementado" cuando exista evidencia en `main` de un flujo mínimo coherente, incluyendo como mínimo:

1. persistencia o contrato de dominio;
2. backend funcional;
3. frontend o consumidor definido;
4. autorización cuando aplique;
5. pruebas del flujo principal;
6. integración financiera documentada si genera movimientos;
7. actualización de este documento.

## Relación con Sprint 2

Donaciones fue parte del objetivo planteado para Sprint 2, pero la fotografía actual de `main` no contiene el flujo funcional mínimo originalmente esperado. Este estado se refleja en `docs/project/sprint-2.md` como alcance pendiente y no como entrega completada.

## Fuentes relacionadas

- `backend/prisma/schema.prisma`
- `frontend/src/content/publicSiteContent.ts`
- `frontend/src/features/financial/model/financial.types.ts`
- `docs/modules/financial.md`
- `docs/project/sprint-2.md`
