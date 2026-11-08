# Proposal

## Why

SGI-Curime necesita una demostración académica visualmente completa, pero las fotografías P01–P04 provienen de búsquedas web y sus licencias, autorías y procedencia no están verificadas. About debe conservar su composición prevista mediante una referencia visual reemplazable, sin presentar P03 como fotografía oficial ni debilitar los requisitos previos a un despliegue público.

## What Changes

- Catalogar P01–P04 como recursos provisionales de referencia académica con licencia y autoría no verificadas.
- Distinguir explícitamente recursos provisionales de diseño, recursos autorizados para publicación y requisitos pendientes de despliegue.
- Mantener P03 como referencia visual seleccionada para la composición de About, sin copiarla, transformarla, publicarla ni atribuirle autoría dentro del alcance inicial.
- Preparar `AboutSection` para consumir una referencia visual configurable y reemplazable sin cambiar su composición, contenido, enlace ni jerarquía.
- Usar durante el prototipo un recurso autorizado existente o un placeholder local basado en activos y tokens vigentes; nunca depender de una imagen web de licencia desconocida.
- Exigir evidencia de licencia o autorización, permiso de transformación, procedencia y crédito antes de clasificar cualquier fotografía como apta para publicación.
- Conservar originales y logotipos actuales sin reemplazo; registrar las equivalencias del ZIP únicamente como inventario.
- Validar About en 320, 375, 768, 1024 y 1440 px, incluyendo accesibilidad, contraste, estabilidad y ausencia de overflow.
- Mantener intactos Hero, Header, Footer, Community, Latest News, Eventos, demás módulos, rutas y contratos backend.
- Conservar P02 como referencia posible para una exploración futura de Hero, fuera de este cambio; P01 y P04 permanecen reservadas.

## Capabilities

### New Capabilities

- `public-visual-identity`: Clasificación, trazabilidad, selección segura y presentación reemplazable de activos visuales en superficies públicas y prototipos académicos.

### Modified Capabilities

- Ninguna.

## Impact

- Código previsto: configuración visual interna del feature público y ajuste presentacional limitado a `frontend/src/features/public-site/ui/components/AboutSection.tsx`.
- Activos previstos en el alcance inicial: únicamente un placeholder local o recurso cuya autorización ya pueda demostrarse; P03 no entra en `frontend/public` mientras su licencia siga desconocida.
- Planificación: inventario, clasificación y requisitos de despliegue dentro de este cambio OpenSpec.
- Sin cambios en APIs, modelos de dominio, hooks, rutas, autenticación, capabilities, dependencias, Hero, Header, Footer, Community, Latest News ni Eventos.
- Despliegue público bloqueado para cualquier fotografía provisional hasta verificar derechos, procedencia, transformaciones permitidas y créditos.
