## Why

La Home pública conserva correctamente la identidad Curime, pero presenta deuda visual en jerarquía, densidad de navegación, separación de tarjetas, composición responsive y continuidad entre secciones. Es necesario elevar legibilidad y percepción de calidad antes de incorporar nuevos bloques de contenido, sin alterar las gestiones ya disponibles.

## What Changes

- Refinar composición visual de `LandingPage` y sus secciones existentes.
- Mejorar proporciones, espaciado, clipping y jerarquía de `HeroSection`.
- Mejorar legibilidad de `PublicHeader` entre 1024px y 1439px, preservando navegación y menú móvil.
- Reforzar jerarquía, equilibrio de filas y distinción entre servicios activos y próximos.
- Refinar `TransparencySection`, `AboutSection`, acceso privado y `PublicFooter`.
- Corregir el uso de utilities/tokens visuales inexistentes dentro del alcance de Home.
- Validar explícitamente 320px, 375px, 768px, 1024px, 1280px y 1440px+.
- Preservar copy, destinos, autenticación, capabilities, reservas, afiliación, eventos y backend.
- No instalar dependencias, crear rutas ni incorporar fotografía externa.

## Capabilities

### New Capabilities

- `public-home-visual-polish`: Contrato visual, responsive y de accesibilidad para la Home pública de SGI-Curime, sin modificar comportamiento funcional.

### Modified Capabilities

<!-- No existing spec requirements change. -->

## Impact

- Componentes afectados: `frontend/src/features/public-site/ui/pages/LandingPage.tsx` y componentes Home, header y footer relacionados.
- Posibles ajustes focalizados en `frontend/src/tailwind.css` para tokens visuales actuales; `index.css` queda fuera salvo bloqueo demostrado.
- Tests públicos pueden ampliarse para proteger jerarquía, destinos y estados existentes.
- No hay cambios previstos en APIs, backend, contratos, dependencias, rutas, autenticación, guards o capabilities.
