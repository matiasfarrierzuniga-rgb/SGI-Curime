# Tasks

## 1. Baseline and equivalence matrix

- [x] 1.1 Inventariar desde `erpNavigation.ts` cada sección, acceso, submenú, ícono, ruta, destino y capacidad efectiva; registrar matriz de equivalencia para modos expandido, colapsado y móvil, y verificar que no se modifica esa fuente de verdad.
- [x] 1.2 Revisar pruebas existentes de `ErpLayout` y `erpNavigation`; añadir o ajustar cobertura de rutas, visibilidad autorizada/no autorizada, submenús y acciones persistentes, verificando que las pruebas focalizadas pasan.

## 2. Refinamiento visual del sidebar

- [x] 2.1 Actualizar exclusivamente la composición visual del sidebar de escritorio en `ErpLayout` para eliminar ilustración y lema decorativos, compactar encabezado y conservar marca SGI-Curime y acentos por área; verificar ausencia del arte decorativo y presencia de marca en render de escritorio.
- [x] 2.2 Ajustar densidad, contenedor de desplazamiento y separación de acciones sin modificar datos de navegación; verificar que todos los accesos autorizados siguen recorribles y que «Ver sitio público» y «Cerrar sesión» conservan destino y efecto.
- [x] 2.3 Conservar interacción expandida, colapsada y responsive dentro del componente actual; verificar nombres accesibles, foco visible, apertura/cierre y navegación de accesos en escritorio compacto y hoja móvil.

## 3. Validación de alcance

- [ ] 3.1 Ejecutar pruebas focalizadas de `ErpLayout` y `erpNavigation`, además de typecheck/lint aplicables; registrar comandos, resultados y cualquier bloqueo sin declarar éxito no ejecutado.
- [ ] 3.2 Revisar visualmente composición y desplazamiento en anchos móvil, tableta y escritorio; contrastar resultado con la matriz de equivalencia y confirmar 100% de accesos, submenús, rutas, íconos, colores y RBAC conservados.
- [x] 3.3 Declarar trazabilidad: cambio de presentación sin regla funcional nueva; CU V2 relacionado `NOT_VERIFIED` localmente y sin modificación de contratos V1/API/DB.

## Workflow follow-up

- Revisar resultado visual y matriz de equivalencia antes de autorizar commit.
- Archivar el cambio tras aprobación de implementación, evidencia de validación y requisitos de revisión del proyecto.
