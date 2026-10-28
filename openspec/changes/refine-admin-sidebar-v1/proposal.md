# Proposal

## Why

El sidebar administrativo actual reserva espacio vertical para una ilustración institucional decorativa, reduciendo el área disponible para navegación en módulos con muchos accesos. Se requiere una presentación más compacta y clara sin alterar ningún destino, jerarquía de submenús ni control de acceso existente.

## What Changes

- Eliminar la ilustración decorativa de montañas, sol y lema del sidebar de escritorio.
- Compactar el encabezado y conservar el identificador visual SGI-Curime.
- Redistribuir la navegación para aprovechar el espacio vertical y mantener desplazamiento accesible y estable.
- Mantener los colores de acento por área funcional, todos los íconos, módulos, accesos y submenús visibles para cada conjunto de capacidades.
- Conservar comportamientos expandido, colapsado y responsive, incluidas las acciones «Ver sitio público» y «Cerrar sesión».
- Preservar sin cambios rutas, destinos, capacidades RBAC y filtrado de navegación.

## Capabilities

### New Capabilities
- `erp-sidebar-navigation`: presentación y navegación lateral administrativa que conserva equivalencia de accesos, rutas, íconos y visibilidad basada en capacidades en todos sus modos.

### Modified Capabilities
- Ninguna.

## Impact

- Afecta la composición visual del sidebar en `frontend/src/app/layouts/ErpLayout.tsx` y su cobertura de pruebas.
- Conserva `frontend/src/app/navigation/erpNavigation.ts` como fuente de navegación, rutas, íconos y capacidades; no modifica APIs, contratos backend, dependencias ni esquema de datos.
