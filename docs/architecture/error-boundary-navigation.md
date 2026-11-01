# Error boundary y navegación contextual

Estado: implementado en frontend V1. Fecha: 2026-10-31.

## Causa raíz

`frontend/src/shared/ui/ErrorBoundary.tsx` tenía un enlace fijo a `/profile`.
No consultaba la ruta activa. En SGI-Curime, `/profile` pertenece al portal
público autenticado, mientras `/app/profile` pertenece al shell ERP. Por eso un
fallo de renderizado en `/app/admin/assemblies/:id` abandonaba el contexto ERP y
terminaba en el perfil público.

## Composición verificada

`AppProviders` monta `BrowserRouter` y luego el `ErrorBoundary`, por lo que el
boundary captura errores de renderizado de las rutas, pero puede recibir la ruta
activa mediante `useLocation`. Los errores de consultas manejados por cada
feature (`ErrorState`) no son excepciones de renderizado.

La autorización sigue otro flujo:

- `InternalErpRoute` controla autenticación y acceso al ERP.
- `RoleRoute` valida capabilities y redirige denegaciones a `/403`.
- `ErrorBoundary` no interpreta `401`, `403` ni cambia esas redirecciones.

## Política de recuperación

| Ruta con fallo de renderizado | Destino |
| --- | --- |
| `/app/admin/assemblies/:id` | `/app/admin/assemblies` |
| Otra ruta ERP (`/app`, `/admin`, `/inventory`) | `/app/profile` |
| Ruta pública o de acceso | `/` |

La navegación usa un enlace real para permitir recarga completa y reiniciar el
estado fallido del boundary. La prueba de regresión cubre el detalle de Asamblea,
la conservación de navegación pública y la separación frente a `/403`.
