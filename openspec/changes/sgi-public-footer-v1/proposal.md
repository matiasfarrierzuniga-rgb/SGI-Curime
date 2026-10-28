# Proposal

## Why

El footer público ya conserva datos institucionales y accesos correctos, pero su composición no tiene un contrato responsive explícito y el botón autenticado `Cerrar sesión` hereda estilos `ghost` que pueden mostrar una superficie clara fuera de la jerarquía visual del pie institucional. Se requiere definir un footer compacto, consistente y accesible sin alterar autenticación, navegación ni contenido publicado.

## What Changes

- Refinar la presentación de `PublicFooter` con contenedor de hasta 1200 px, cuatro columnas en escritorio, dos en tablet y flujo legible en móvil.
- Establecer padding vertical de 40 px en escritorio, 32 px en tablet y 28 px en móvil, preservando fondo marrón institucional, marca y onda decorativa.
- Mantener los datos y enlaces proporcionados por `publicSiteContent`, incluidos contacto, redes, enlaces rápidos y accesos según sesión/capacidad.
- Corregir localmente la variante visual de `Cerrar sesión` para conservar fondo transparente/marrón, texto legible y estados hover/focus coherentes con el footer.
- Eliminar sólo vacíos y sobredimensionamiento presentes dentro de la composición del footer, sin modificar comportamiento de login, logout ni rutas.

## Capabilities

### New Capabilities
- `public-site-footer`: Presentación institucional responsive y accesible del footer público, incluidos enlaces de navegación y acción de sesión.

### Modified Capabilities
- None.

## Impact

- Affected code: `frontend/src/features/public-site/ui/components/PublicFooter.tsx`.
- No cambios a API, backend, Prisma, autenticación, permisos, rutas, contenido de `publicSiteContent` ni componentes UI globales.
