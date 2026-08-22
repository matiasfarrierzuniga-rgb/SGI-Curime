---
name: sgi-responsive-accessibility
description: Establecer los requisitos responsive y de accesibilidad del frontend SGI-Curime. Usar al diseñar, implementar o revisar layouts, navegación, componentes interactivos, formularios y estilos.
---

# Responsive y accesibilidad de SGI-Curime

## Responsive

- Desktop: mantener el sidebar permanente cuando exista espacio y proporcionar un contenido principal amplio.
- Tablet: usar un sidebar colapsable.
- Mobile: proporcionar un drawer o menú accesible, controles táctiles adecuados y contenido sin overflow horizontal.

## Accesibilidad

- Permitir navegación por teclado y mostrar un focus visible.
- Mantener contraste suficiente.
- Usar `aria-label` cuando sea necesario.
- Usar landmarks semánticos.
- Dar nombres accesibles a los botones.
- Asociar cada input con un label.
- No depender únicamente del color para comunicar información.
- Mostrar claramente los estados disabled.
- Asociar los mensajes de error con sus campos.
- Hacer accesible la navegación móvil, incluido su control de apertura, cierre y foco.
- Respetar `prefers-reduced-motion` cuando se agreguen animaciones.
