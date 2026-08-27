---
name: sgi-frontend-design
description: Define el lenguaje visual institucional de SGI-Curime. Usar al diseñar, implementar o revisar interfaces, componentes y estilos del frontend; no aplica a backend ni autoriza cambios de branding.
---

# Diseño frontend de SGI-Curime

## Propósito

Definir el lenguaje visual general del frontend de SGI-Curime, el Sistema de Gestión Integral de la Asociación de Desarrollo Integral de Curime.

## Identidad

Proyectar una estética institucional, comunitaria, moderna, limpia, profesional y accesible.

Usar como paleta orientativa:

- Verde bosque oscuro.
- Verdes naturales.
- Dorado u ocre cálido.
- Crema.
- Blanco.

No cambiar branding confirmado sin una instrucción explícita.

## Principios de diseño

- Establecer una jerarquía visual clara y contenido fácil de escanear.
- Mantener espacios consistentes, layouts respirados y tipografía legible.
- Usar border radius moderado, sombras suaves e iconografía consistente.
- Usar cards solamente cuando aporten una agrupación significativa.
- Hacer visibles los estados hover y focus.
- Diseñar de forma responsive desde el inicio.
- Mantener coherencia visual y de interacción entre módulos.

## Tipografía institucional

- Usar DM Sans como familia única en portal público, autenticación, ERP, módulos,
  formularios, tablas, navegación y componentes compartidos.
- Los tokens `--font-sans` y `--font-heading` son alias semánticos de la misma
  familia. Construir la jerarquía con tamaño, peso, line-height, spacing y color,
  no alternando tipografías entre áreas del producto.
- Usar la escala tipográfica compartida: display, H1, H2, H3, body large, body,
  body small, label, caption y navigation. Evitar tamaños arbitrarios por página.
- No superar dos familias aprobadas ni agregar fuentes, cargas remotas o
  declaraciones `font-family` locales sin una decisión explícita del sistema de
  diseño y una justificación de rendimiento.
- Mantener pesos legibles: 700 para display/H1/H2, 600 para H3, 400 para cuerpo y
  500–600 para labels y navegación. No usar pesos ultraligeros en información
  importante.

## Evitar

- Interfaces genéricas con apariencia de template o excesivamente generadas por IA.
- Glassmorphism innecesario, gradientes excesivos, neón o decoración estridente.
- Saturación de cards.
- Botones con jerarquía visual idéntica cuando sus acciones tienen distinta importancia.
- Animaciones meramente decorativas.
- Estilos ad hoc duplicados.
- Copiar literalmente la identidad visual de otros sistemas.

Las referencias de otros dashboards pueden servir para estudiar orden, jerarquía, sidebar, topbar y separación de módulos, nunca para copiar su identidad visual.
