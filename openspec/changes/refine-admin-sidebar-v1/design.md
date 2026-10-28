# Design

## Context

Véase `proposal.md` para motivación y `specs/erp-sidebar-navigation/spec.md` para contrato visible. `ErpLayout` ya compone el sidebar fijo de escritorio, la hoja móvil y las acciones persistentes; `getErpNavigation` centraliza secciones, íconos, rutas y filtrado por capacidades. La ilustración institucional ocupa un bloque fijo separado entre navegación desplazable y acciones.

## Goals / Non-Goals

**Goals:**
- Recuperar espacio vertical eliminando el bloque decorativo y compactando la composición del encabezado.
- Mantener la fuente única de navegación y sus filtros por capacidades sin cambios funcionales.
- Definir una verificación de equivalencia para modos expandido, colapsado y móvil.

**Non-Goals:**
- No cambiar rutas, capacidades, contratos API, estado de autenticación, módulos, íconos ni reglas de visibilidad.
- No rediseñar el encabezado global, menú de perfil, navegación pública ni arquitectura frontend.

## Decisions

### Composición dentro de `ErpLayout`
La mejora se concentra en composición y clases del sidebar de `ErpLayout`; se eliminará el bloque decorativo y se ajustarán densidad, separación y área de desplazamiento. Esto preserva los límites actuales del componente y evita alterar datos de navegación.

Alternativa descartada: mover o recrear datos de navegación para adaptarlos al diseño. Duplicaría rutas, íconos y reglas RBAC, aumentando riesgo de diferencias funcionales.

### Navegación como contrato inmutable durante refinamiento
`erpNavigation.ts` y `getErpNavigation` se tratarán como fuente de verdad sin cambios. El render existente seguirá recibiendo la misma estructura visible filtrada por capacidades, por lo que el trabajo visual no concede ni retira accesos.

Alternativa descartada: consolidar o reagrupar secciones durante el refinamiento. Cambiaría jerarquía observable y impediría demostrar equivalencia 100%.

### Acciones y desplazamiento separados de contenido navegable
El contenedor de navegación conservará su área flexible y desplazable; acciones de sitio público y cierre de sesión permanecerán ancladas fuera de ese desplazamiento. El tamaño compacto conservará nombres accesibles y controles de foco.

Alternativa descartada: trasladar acciones a un menú de cuenta. Añadiría una jerarquía y flujo distintos, contrario a requisito de conservación.

### Matriz de equivalencia basada en datos y pruebas existentes
Las pruebas de navegación y layout se ampliarán para comprobar: secciones e ítems autorizados, submenús, `href`/destinos, estado de capacidades, ausencia de la ilustración y presencia de acciones en cada modo. La comparación parte de la navegación declarada, no de una lista manual que pueda quedar desactualizada.

## Risks / Trade-offs

- [Cambio visual omite un acceso en modo compacto o móvil] → Mitigación: validar la matriz contra `getErpNavigation` y cubrir vistas expandida, colapsada y móvil.
- [Ajustes de altura afectan desplazamiento o acciones] → Mitigación: conservar contenedores flexibles y ejecutar pruebas de interacción/foco relevantes.
- [Eliminación de arte decorativo deja estilo inconsistente] → Mitigación: usar tokens y acentos existentes; revisar composición en anchos móvil, tableta y escritorio.
- [Cambios accidentales de RBAC] → Mitigación: no modificar `erpNavigation.ts`, capacidades ni rutas; verificar casos autorizados y no autorizados.

## Migration Plan

1. Aplicar el cambio visual aislado al componente de sidebar y sus pruebas.
2. Verificar equivalencia de navegación, acciones, modo responsive y accesibilidad en el entorno de desarrollo.
3. Desplegar como cambio frontend sin migración de datos, API ni configuración.
4. Ante regresión, restaurar la composición previa de `ErpLayout`; no se requieren transformaciones ni rollback de datos.
