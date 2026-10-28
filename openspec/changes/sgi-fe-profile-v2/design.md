# Design

## Context

La motivación y el alcance están en `proposal.md`; los comportamientos verificables están en `specs/profile-account-security/spec.md`.

El estado actual concentra presentación de cuenta y cambio de contraseña en `frontend/src/features/profile/ui/ProfilePage.tsx`. La identidad se obtiene de `useAuth()` y el rol visible se normaliza con `getRoleName`; las rutas `/profile` y `/app/profile` reutilizan la misma pantalla. La pantalla ya usa primitivas compartidas (`Card`, `FormField`, `Input`, `Button`, `Alert`, `StatusBadge`, `PageHeader`) y tokens Tailwind institucionales.

El transporte actual está en `frontend/src/features/auth/api/auth.api.ts`. El backend expone `PATCH /auth/change-password` con JWT y `ChangePasswordDto`, cuya forma verificada es `currentPassword`, `newPassword` y `newPasswordConfirmation`; la política de contraseña, revocación de sesiones y auditoría son responsabilidad backend.

## Goals / Non-Goals

**Goals:**

- Crear jerarquía clara entre identidad, información de cuenta y seguridad dentro del límite de la pantalla existente.
- Usar exclusivamente datos reales de sesión y representar ausencias sin datos ficticios.
- Mantener contrato backend como fuente de verdad, resolviendo la discrepancia de nombres en la frontera del servicio frontend.
- Ofrecer controles de contraseña independientes, feedback completo, prevención de duplicados y limpieza posterior al éxito.
- Mantener composición institucional, teclado, foco, semántica y responsive en los cuatro anchos solicitados.

**Non-Goals:**

- No modificar `ChangePasswordDto`, endpoint, guards, política de contraseña, revocación de sesiones, auditoría, Prisma, migraciones ni datos.
- No editar datos personales, roles, permisos, afiliación o cargos institucionales.
- No cambiar rutas, `ErpLayout`, Sidebar, Header, Dashboard ni arquitectura `app -> features -> shared`.
- No introducir dependencias, fuentes, tokens globales ni componentes shared específicos de perfil sin necesidad justificada.

## Decisions

### Composición dentro de la feature de perfil

Mantener `ProfilePage` como entry point y organizar su contenido en tres zonas: cabecera de identidad, información de cuenta de solo lectura y tarjeta/sección independiente de seguridad. La cabecera utilizará avatar textual por iniciales, jerarquía nombre/correo, rol proveniente de sesión y estado solo si es confiable.

Alternativa descartada: crear una ruta o layout de perfil nuevo. Duplicaría comportamiento entre `/profile` y `/app/profile` y ampliaría el cambio fuera de la feature solicitada.

### Datos de sesión y ausencias

`useAuth().user` seguirá siendo única fuente para identidad visible. Los roles se mostrarán mediante la representación ya disponible (`getRoleName`) y nunca se derivarán de cargos. Cada campo opcional conservará etiqueta y usará un texto explícito de ausencia; no se añadirán llamadas ni propiedades inventadas para completar la vista.

Alternativa descartada: consultar una entidad `Person`, `Affiliate` o endpoint adicional desde la pantalla. Introduciría otra fuente de verdad y mezclaría identidad física, acceso y afiliación.

### Contrato de cambio de contraseña en la frontera API

La UI mantendrá nombres semánticos legibles para su estado local, pero `authService.changePassword` deberá entregar al backend `currentPassword`, `newPassword` y `newPasswordConfirmation`, conforme al DTO comprobado. La corrección se limitará a la adaptación frontend y sus pruebas; no cambiará `PATCH /auth/change-password` ni su semántica.

La validación de coincidencia puede ejecutarse antes del envío para feedback inmediato, pero requisitos de seguridad, errores de contraseña actual y diferencia con la anterior seguirán siendo autoritativos del backend. No se escribirán contraseñas en logs, almacenamiento de sesión ni mensajes de diagnóstico.

Alternativa descartada: modificar el DTO backend para aceptar ambos nombres. Aumentaría compatibilidad accidental y cambiaría un contrato de autenticación fuera del alcance aprobado.

### Visibilidad y ciclo de envío

La visibilidad será estado efímero independiente para cada campo, controlada por botones con nombre accesible y sin alterar valores. El formulario tendrá una única operación de submit; mientras esté pendiente, el botón se bloqueará y expondrá estado ocupado. Éxito limpiará los tres valores y notificará mediante el mecanismo existente; error conservará valores editables sin revelar secretos.

Alternativa descartada: componente o estado global de contraseñas. Aumentaría exposición y no aporta persistencia funcional.

### Lenguaje visual y responsive

Usar tokens existentes de verde institucional, dorado, marfil, superficies, bordes, estados y tipografía aprobada. La cabecera tendrá contraste y jerarquía, la información usará una cuadrícula compacta que colapsa a una columna en viewport estrecho y seguridad mantendrá campos con ancho legible y acciones claramente priorizadas.

Se validarán explícitamente 375, 768, 1280 y 1440 px, además de teclado y foco visible. No se introducen estilos globales ni modificaciones de Sidebar/Header/Dashboard.

### Verificación

Ampliar `frontend/src/features/profile/ui/ProfilePage.test.tsx` y las pruebas del servicio si el cambio de mapeo lo requiere. La matriz mínima cubrirá identidad completa/parcial, ausencia explícita, campos de solo lectura, tres controles independientes, coincidencia, payload con nombres backend, carga sin duplicados, éxito con limpieza, error recuperable y accesibilidad básica.

## Risks / Trade-offs

- [El cambio de nombres del payload podría romper expectativas de mocks existentes] → actualizar pruebas del servicio y de `ProfilePage` para afirmar la forma backend, sin alterar el endpoint.
- [El backend revoca sesiones al cambiar contraseña] → verificar el comportamiento de la sesión actual y de la siguiente solicitud protegida usando el flujo existente; no introducir una política frontend nueva.
- [Datos opcionales de sesión pueden producir una cabecera visual vacía] → conservar etiquetas, estados de ausencia y composición resiliente; no rellenar con datos ficticios.
- [Controles de visibilidad pueden perder accesibilidad o foco] → usar botones etiquetados, foco visible, orden de tabulación estable y pruebas de interacción por teclado.
- [La densidad desktop puede desbordar en móvil] → aplicar composición mobile-first y revisar los cuatro anchos definidos, especialmente correo largo y mensajes de error.

## Migration Plan

1. Implementar la composición visual y el comportamiento dentro de la feature existente, reutilizando primitivas y tokens actuales.
2. Adaptar el payload de `authService` al DTO backend y ajustar pruebas focalizadas; no ejecutar migraciones ni cambios de API.
3. Verificar rutas `/profile` y `/app/profile`, interacción de contraseña, estados, teclado, responsive y regresión de datos de sesión.
4. Ejecutar lint, arquitectura, pruebas y build frontend; realizar QA visual en los anchos definidos.
5. Rollback: restaurar los archivos frontend del incremento si la revisión falla; no requiere rollback de base de datos ni configuración.

## Open Questions

- Confirmar durante APPLY, con pruebas de integración disponibles, cómo se comporta la sesión actual después de la revocación backend posterior a un cambio exitoso. Esta verificación no cambia el contrato ni autoriza modificar el backend.
