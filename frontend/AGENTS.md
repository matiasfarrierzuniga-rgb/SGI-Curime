# Frontend — instrucciones locales para SGI-Curime

Aplican además las reglas de `../AGENTS.md` y `CONVENTIONS.md`. Este archivo no crea otro agente.

## Arquitectura

- React 19, TypeScript, Vite 8, React Router 7, Axios, TanStack Query y Tailwind 4. Trabaja dentro de `src/app`, `src/features/<domain>` y `src/shared`, respetando dependencias y APIs públicas de `src/features/*/index.ts`.
- `src/pages`, `src/services`, `src/types`, `src/components` y `src/content` raíz son zonas legacy: no agregar código nuevo salvo excepción documentada.
- Los datos de servidor viven en TanStack Query; evita duplicarlos en stores o estado local. Usa el cliente HTTP y patrones de error ya existentes.
- Antes de cambiar comportamiento funcional o rutas, identifica los CU V2 relacionados y contrástalos con contratos API, guards, rutas, feature slices y pruebas V1. El catálogo no autoriza UI, rutas ni permisos inexistentes.
- Conserva los tokens de diseño SGI-Curime en `src/tailwind.css`, DM Sans y DM Serif Display, accesibilidad, foco, teclado y diseño responsive. No copiar la marca visual de Odoo.

## Registro comunitario — UX objetivo, todavía propuesto

Lee `../docs/decisions/community-account-registration.md`; no mostrar como real lo que todavía no implementó el backend.

- Pantalla `/register`: nombre, correo y contraseña, confirmación de contraseña, aviso de tratamiento de datos y mensajes accesibles (campos definitivos sujetos a decisión).
- Al enviar, mostrar estado neutral «Revisá tu correo para verificar tu cuenta», sin simular sesión activa ni acceso al ERP; considerar respuesta uniforme contra enumeración de cuentas.
- Permitir reenvío del enlace con límites y avisos comprensibles. Diferenciar inválido, caducado, reutilizado y activado correctamente; no validar criptográficamente un token en navegador.
- Una vez verificado, redirigir a `/login` o al inicio comunitario conforme al contrato aprobado; no emitir sesión por iniciativa del frontend.
- La navegación posterior a login distingue portal `Mi Comunidad` del dashboard ERP, con permisos y rutas explícitos. Las capacidades server-side prevalecen; prevenir destellos de contenido protegido durante restauración de sesión.
- No pedir cédula legal en la UI básica si la decisión aprobada permite identidad mínima. Los formularios institucionales pueden requerir datos adicionales después.
- Permitir afiliación, voluntariado y propuesta de emprendimiento desde el lugar correcto, pero no conceder a la cuenta nueva privilegios de administración de esos módulos.
- Voluntariado público sigue accesible sin cuenta; sus beneficios de seguimiento autenticado son adicionales.

## Validación

- Para el cambio de registro, verificar errores de formulario, email repetido, reenvío, expiración, carga, errores HTTP, enfoque/foco, 320/375/768/1024/1440 px, lector de pantalla y teclado.
- `npm run verify` corre lint + arquitectura + tests + build y es apto para fase VERIFY autorizada en workspace aislado; no ejecutarlo como exploración de solo lectura si genera artefactos.
- Cubrir `401` y `403`, rutas directas, usuario comunitario sin `erp.dashboard.read` y validación de que no se muestran datos protegidos.
- Documentar mocks y escenarios simulados como simulados; nunca presentarlos como funcionalidades backend reales.
