# SGI-Curime frontend

React 19 + TypeScript + Vite SPA. Arquitectura vigente: `app -> features -> shared`; `src/pages`, `src/services`, `src/types`, `src/components` y `src/content` son zonas legacy sin código nuevo salvo excepción documentada.

## Acceso y rutas

El frontend consume capacidades efectivas entregadas por servidor. Sidebar, rutas, dashboard y acciones deben reflejar una operación backend equivalente, pero el guard API sigue siendo autoritativo. No se infiere acceso desde nombre de rol, cargo institucional, afiliación, `sessionStorage` ni estado de ruta.

- Eventos públicos permanecen en `/eventos`; gestión institucional en `/app/events` exige capacidades de operación existentes.
- Voluntariado público permanece sin cuenta en `/voluntariado`; la ruta administrativa `/app/admin/volunteering` exige capacidad efectiva.
- La cuenta comunitaria verificada accede a Mi Comunidad y no al ERP por autenticación sola.
- Secretaría conserva acceso a nombramientos y afiliaciones únicamente según capacidades persistidas; el formulario de agregar nombramiento sigue pendiente de corrección funcional completa (selección, guardado, notificación y refresco), aunque la ruta sea accesible.

## Contratos y desarrollo

Consulta [`CONVENTIONS.md`](./CONVENTIONS.md), [`AGENTS.md`](./AGENTS.md) y [`../docs/contracts/account-lifecycle-v1.md`](../docs/contracts/account-lifecycle-v1.md) antes de modificar rutas, formularios o autenticación. El registro comunitario no crea ni aprueba `UserRequest` ordinario.

La estabilización RBAC V2.3 está en [`../openspec/changes/stabilize-rbac-v2-3-access-and-legacy-reconciliation/`](../openspec/changes/stabilize-rbac-v2-3-access-and-legacy-reconciliation/). La implementación recuperada sigue pendiente de certificación final; no se deben introducir grants, rutas ficticias ni reversión de flujos recuperados para satisfacer documentos históricos.
