# Proposal

## Why

Las páginas públicas de eventos comunican correctamente los datos, pero el listado usa demasiado espacio vertical y el detalle aísla el contenido dentro de una superficie única. Esto reduce el escaneo, retrasa la información importante en el viewport y debilita la continuidad visual del portal institucional.

## What Changes

- Refinar la composición visual de `/eventos` con encabezado compacto, tarjetas equilibradas y metadata escaneable.
- Reorganizar `/eventos/:publicId` para diferenciar título, resumen, metadata y descripción sin aislar excesivamente el contenido.
- Mantener la navegación visible entre listado y detalle, incluyendo el retorno a eventos.
- Aplicar composición mobile-first para 320, 375, 768, 1024 y 1440 px.
- Reutilizar los tokens institucionales existentes en `frontend/src/tailwind.css` y los primitives ya disponibles.
- Preservar datos, endpoints, rutas, autenticación, estados loading/error/empty y comportamiento de React Query.
- No agregar filtros, campos, dependencias, contenido externo ni cambios de backend.

## Capabilities

### New Capabilities

- `public-events-presentation`: Presentación pública responsive y accesible del listado y detalle de eventos institucionales.

### Modified Capabilities

- Ninguna.

## Impact

- Código previsto: `frontend/src/features/events/ui/PublicEventsPage.tsx` y `frontend/src/features/events/ui/PublicEventDetailPage.tsx`.
- Posible ajuste local de composición; no se prevén cambios en APIs, modelos, hooks, servicios, router, footer, formulario de afiliación, ERP ni componentes compartidos.
- Dependencias: ninguna nueva.
- Validación posterior: revisión visual en 320/375/768/1024/1440 px, teclado, foco, contraste y estados de datos existentes.
