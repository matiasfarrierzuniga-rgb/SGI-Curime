# Frontend — instrucciones locales para SGI-Curime

## Alineación de acceso ERP y registro D03–D08 (2026-11-16)

- Sidebar, rutas React y backend deben corresponder a capacidades persistidas efectivas. No derivar acceso del nombre del rol, cargo, afiliación o nombramiento.
- No agregar al sidebar institucional funciones personales sin criterio de elegibilidad. «Mis asambleas» y justificaciones propias son flujos self-service; el backend debe comprobar titularidad y contexto, no solo que exista sesión.
- Para cada ruta administrativa: visibilidad de sidebar, guard React y guard de API alineados; acceso por URL directa sin permiso debe resultar denegado. No inventar capabilities, grants ni rutas sin contrato aprobado.
- D03–D08 aprobó `User.displayName` obligatorio en nuevas cuentas; separar contrato objetivo de AS-IS hasta comprobar DTO, persistencia, UI y pruebas. No modificar esquema/migraciones sin autorización adicional.
- Cambios por PR revisable. Pruebas no ejecutadas se declaran `NOT_EXECUTED`, nunca `PASSED`.

Aplican además las reglas de `../AGENTS.md` y `CONVENTIONS.md`. Este archivo no crea otro agente.

## Arquitectura

### Contexto operativo P0 — DEVELOPMENT ONLY

Objetivo actual: completar desarrollo funcional para certificación posterior. No ejecutar automáticamente suites, lint, builds, auditorías generales RBAC ni cambios que creen infraestructura, worktrees o rutas/grants nuevos. Preservar flujos recuperados y diferir VERIFY hasta autorización expresa. Las decisiones funcionales aprobadas, contratos vigentes y código actual prevalecen sobre matrices históricas que contradigan RBAC V2.3.

- React 19, TypeScript, Vite 8, React Router 7, Axios, TanStack Query y Tailwind 4. Trabaja dentro de `src/app`, `src/features/<domain>` y `src/shared`, respetando dependencias y APIs públicas de `src/features/*/index.ts`.
- `src/pages`, `src/services`, `src/types`, `src/components` y `src/content` raíz son zonas legacy: no agregar código nuevo salvo excepción documentada.
- Los datos de servidor viven en TanStack Query; evita duplicarlos en stores o estado local. Usa el cliente HTTP y patrones de error ya existentes.
- Antes de cambiar comportamiento funcional o rutas, identifica los CU V2 relacionados y contrástalos con contratos API, guards, rutas, feature slices y pruebas V1. El catálogo no autoriza UI, rutas ni permisos inexistentes.
- Conserva los tokens de diseño SGI-Curime en `src/tailwind.css`, DM Sans y DM Serif Display, accesibilidad, foco, teclado y diseño responsive. No copiar la marca visual de Odoo.
- Sidebar, dashboard, rutas y botones reflejan capacidades efectivas y una operación backend existente; no restaurar flujos ni mostrar destinos ficticios para satisfacer documentación antigua. Secretaría mantiene nombramientos y afiliaciones según capacidades persistidas; el formulario de agregar nombramiento no se considera resuelto hasta completar selección de Person, guardado, feedback y refresco.

## Skills y autoridades locales

- `CONVENTIONS.md` es la fuente operativa para arquitectura, tokens, tipografía, primitives y validación frontend; las skills SGI la complementan, no la reemplazan.
- Selecciona solo las skills necesarias: `sgi-frontend-architecture` para estructura, `sgi-frontend-design` para UI visual, `sgi-forms-validation` para formularios, `sgi-dashboard-ux` para shell/navegación y `sgi-responsive-accessibility` para responsive/a11y.
- Copias genéricas instaladas para distintos proveedores son referencias suplementarias, no reglas acumulativas. No modificar ni eliminar esas copias salvo alcance explícito.

## Registro comunitario — contrato actual

Consulta primero `../docs/contracts/account-lifecycle-v1.md` y contrasta cualquier cambio con código, endpoints y pruebas. El registro AS-IS usa correo en `/register`; D03–D08 añade `displayName` obligatorio al contrato objetivo (aún no verificado como implementado). La contraseña se establece en verificación; no se crea ni aprueba `UserRequest` para cuentas comunitarias ordinarias. `POST /community-accounts/register` devuelve respuesta neutral y envía verificación cuando corresponde.

- La pantalla de verificación valida el enlace con `validate-token`, permite establecer y confirmar contraseña, y activa mediante `verify-email`; nunca crea sesión desde frontend.
- Tras iniciar sesión, la cuenta accede a `Mi Comunidad`, no al ERP. Capacidades server-side y guards backend prevalecen; evitar destellos de contenido protegido.
- Reenvío usa `resend-verification`, con límites, respuestas neutrales y estados seguro/inválido/caducado/usado; el navegador no valida criptográficamente tokens.
- Vincular una cuenta con una `Person` es operación administrativa posterior, explícita y protegida por `system.identity.manage`; nunca vincular automáticamente por nombre, correo o identificación.
- Registro, verificación y vinculación no crean afiliación, nombramiento ni permisos ERP. Afiliación, voluntariado, emprendimiento y gobierno siguen procesos separados; voluntariado público no exige cuenta.

## Validación

- Para el cambio de registro, verificar errores de formulario, email repetido, reenvío, expiración, carga, errores HTTP, enfoque/foco, 320/375/768/1024/1440 px, lector de pantalla y teclado.
- `npm run verify` corre lint + arquitectura + tests + build y es apto para fase VERIFY autorizada en workspace aislado; no ejecutarlo como exploración de solo lectura si genera artefactos.
- Cubrir `401` y `403`, rutas directas, usuario comunitario sin `erp.dashboard.read` y validación de que no se muestran datos protegidos.
- Documentar mocks y escenarios simulados como simulados; nunca presentarlos como funcionalidades backend reales.
