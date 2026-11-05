# Tasks

## 1. Footer composition

- [x] 1.1 Actualizar exclusivamente `frontend/src/features/public-site/ui/components/PublicFooter.tsx` con contenedor local máximo de 1200 px, gutters responsivos y padding vertical de 28/32/40 px; verificar clases y que no se modifiquen primitives, contenido ni código fuera del componente autorizado.
- [x] 1.2 Ajustar composición de las cuatro regiones a una columna móvil, dos columnas tablet y cuatro columnas desktop; verificar en 320, 768 y 1024+ px ausencia de overflow horizontal, contenido vacío y alturas exageradas. Refinamiento V2 implementado: jerarquía de marca, columnas equilibradas, encabezados de acento y separadores sutiles; revisión real en navegador pendiente.
- [x] 1.3 Preservar fondo `brand-ink`, onda, logotipo oficial, semántica de navegación y datos/le enlaces existentes de `publicSiteContent`; verificar presencia y destinos de contacto, redes, enlaces rápidos, acceso y aviso de copyright. Refinamiento V2 elimina subrayado permanente de enlaces ordinarios y conserva subrayado para hover/focus.

## 2. Acción autenticada y accesibilidad

- [x] 2.1 Estilizar localmente `Cerrar sesión` sobre el footer para fondo transparente o institucional, texto inverso y estados hover/focus/disabled sin superficie blanca; verificar estado autenticado con teclado y puntero, conservando exactamente el handler `logout`. Refinamiento V2 conserva acción secundaria transparente e incorpora icono discreto; interacción real pendiente.
- [x] 2.2 Verificar estados anónimo, autenticado sin acceso ERP y autenticado con acceso ERP; confirmar que los destinos `/login`, `/register`, `/servicios` y `/app` conservan la lógica actual y que no cambia autorización. Confirmado estáticamente: condiciones y destinos existentes no cambiaron.
- [ ] 2.3 Revisar foco visible, landmarks, contraste y objetivos interactivos de al menos 44 px en desktop, tablet y móvil; registrar `NOT_VERIFIED` si no se realiza revisión real en navegador. **NOT_VERIFIED:** revisión en navegador no ejecutada por restricción.

## 3. Validación focalizada

- [ ] 3.1 Ejecutar validación frontend focalizada autorizada y revisar consola; verificar ausencia de regresiones TypeScript, lint y comportamiento público del footer, o registrar cada comando no ejecutado como `NOT_VERIFIED`. **NOT_VERIFIED:** tests, lint y build no ejecutados por restricción.

## Workflow follow-up

- Archivar el cambio sólo cuando implementación y evidencia de verificación satisfagan las tareas abiertas.
