# Tasks

## 1. Preparación y protección de contratos

- [ ] 1.1 Antes de editar, confirmar que `AffiliatesPage.tsx`, `AffiliateFilters.tsx`, `AffiliatesTable.tsx` y `AffiliateDetailsModal.tsx` no contienen trabajo paralelo ajeno; verificar que no se modificarán API, hooks, modelos, rutas, shared UI, `/afiliacion` ni archivos de SGI-FORMS-V1.
- [ ] 1.2 Abrir el wireframe `Panel administrativo de afiliados en SGI-Curime.png` junto con la ruta administrativa y registrar captura baseline desktop; verificar que los datos visibles proceden de contratos vigentes y que los seis controles sin contrato permanecen marcados como dependencias.

## 2. Composición principal y filtros soportados

- [ ] 2.1 Reestructurar `AffiliatesPage.tsx` para reproducir cabecera con icono, título, descripción, región de acción, tarjeta de filtros y tarjeta de resultados; verificar a 1440 y 1024 px orden, jerarquía, superficies, gutters y ausencia de cambios de consulta.
- [ ] 2.2 Ajustar `AffiliateFilters.tsx` para alinear búsqueda, estado y limpieza con el wireframe sin cambiar búsqueda live, estado, reset de página ni parámetros soportados; verificar manualmente que búsqueda y estado vuelven a página 1 y Limpiar restaura ambos valores.
- [ ] 2.3 Representar u omitir de forma explícitamente no engañosa tipo, rango de fechas, Filtrar y Registrar afiliado conforme a decisión aprobada; verificar que no existe `POST /affiliates`, query param no soportado, mutation, modal ficticio ni CTA funcional sin contrato.
- [ ] 2.4 Cubrir estados loading, error y vacío dentro de la composición nueva; verificar mensajes existentes, acción Reintentar/Limpiar cuando corresponda, foco visible y ausencia de datos fabricados.

## 3. Resultados desktop y lista móvil

- [ ] 3.1 Adaptar `AffiliatesTable.tsx` a columnas, avatar determinístico, contacto, badge y acción Ver detalle de la referencia; verificar que cada fila conserva datos del contrato, nombres accesibles y apertura del detalle correcto.
- [ ] 3.2 Integrar paginación visual dentro de tarjeta de resultados manteniendo `page`, `total` y `limit=20`; verificar Anterior/Siguiente, anuncio de página y que no aparece selector de cantidad ni salto de página sin contrato.
- [ ] 3.3 Implementar lista móvil equivalente sin duplicar controles interactivos ni requerir overflow horizontal de página; verificar 768, 390 y 320 px con teclado, estado y apertura de detalle.
- [ ] 3.4 Tratar menú de elipsis contextual como dependencia no implementada; verificar que ninguna acción contextual se muestra si no tiene operación, permiso y contrato definidos.

## 4. Detalle y confirmación de estado

- [ ] 4.1 Adaptar `AffiliateDetailsModal.tsx` a encabezado con avatar/estado, distribución compacta, secciones/pestañas respaldadas por datos y scroll interno; verificar contenido personal, afiliación y contacto con viewport bajo sin cortar acciones ni romper el foco del modal.
- [ ] 4.2 Mantener Editar, Activar y Desactivar como únicas acciones de dominio, con busy y prevención de duplicados vigentes; verificar éxito, conflicto y error recuperable contra las mutations existentes.
- [ ] 4.3 Reproducir confirmación de desactivación con consecuencia de negocio, cancelación y énfasis peligro; verificar que Cancelar no muta, confirmar envía una vez y el foco retorna correctamente tras cerrar.
- [ ] 4.4 Tratar Observaciones como dependencia sin contenido o persistencia; verificar que no se inventan historial, texto, endpoint ni estado local para aparentar la pestaña del wireframe.

## 5. Validación visual, responsive y accesible

- [ ] 5.1 Comparar lado a lado referencia y resultado a 1536×1024 o tamaño original, 1440×900 y 1024×768; verificar matriz de correspondencia, densidad, columnas, superficies, iconos, acciones y paginación, registrando divergencias por contratos ausentes como `NOT_VERIFIED` o `BLOCKED`.
- [ ] 5.2 Validar 768×1024, 390×844 y 320×568; verificar ausencia de overflow de página, objetivos táctiles mínimos de 44 px, etiquetas visibles y lista móvil legible.
- [ ] 5.3 Validar navegación por teclado y lector de pantalla en filtros, filas, detalle y confirmación; verificar orden de foco, foco visible, Escape, cierre, retorno de foco, `aria-live` de paginación y que color no sea único indicador.
- [ ] 5.4 Ejecutar únicamente los controles de calidad frontend autorizados para Apply y registrar resultados reales; verificar que fallos preexistentes se reporten fuera de alcance y que la validación no modifique datos persistidos.

## Workflow follow-up

- Solicitar revisión explícita de las dependencias funcionales antes de activar cualquier control pendiente.
- Verificar implementación contra este cambio antes de archivarlo, una vez completadas tareas y evidencia de calidad.
