# Tasks

## 1. Contrato y línea base

- [x] 1.1 Confirmar en `AuthenticatedUser`, `ProfilePage` y pruebas existentes los datos de sesión disponibles, campos opcionales y representación actual de rol/estado; verificar que la matriz de datos no inventa propiedades ni mezcla `Person`, `Affiliate` o cargos.
- [x] 1.2 Adaptar únicamente la frontera frontend de `authService.changePassword` para enviar `currentPassword`, `newPassword` y `newPasswordConfirmation` a `PATCH /auth/change-password`; verificar con prueba de transporte o mock HTTP que el payload coincide con `ChangePasswordDto` y que no cambia endpoint, guard ni respuesta backend.

## 2. US-PROFILE-01 / US-PROFILE-02 — Identidad e información de cuenta

- [x] 2.1 Reorganizar `ProfilePage` con cabecera de identidad, avatar por iniciales, nombre, correo, rol o roles realmente disponibles y estado confiable; verificar con pruebas de render que el contenido proviene de `useAuth` y que no aparecen valores ficticios.
- [x] 2.2 Presentar información de cuenta como datos de solo lectura, conservar etiquetas para campos ausentes y mantener separadas identidad, acceso, roles/capacidades y asignaciones institucionales; verificar que no existen controles editables y que los estados completo/parcial están cubiertos.
- [x] 2.3 Aplicar a identidad e información la jerarquía visual institucional usando primitivas y tokens existentes; verificar que `frontend/src/features/profile/ui/ProfilePage.test.tsx` conserva cobertura de contenido y que no se modifican Sidebar, Header, Dashboard ni rutas.

## 3. US-PROFILE-03 — Cambio de contraseña

- [x] 3.1 Separar visualmente la sección de seguridad y conservar los tres campos requeridos con autocompletado, límites y mensajes compatibles con la política backend; verificar que los campos están etiquetados y que la validación de confirmación distinta evita la solicitud.
- [x] 3.2 Añadir controles independientes para mostrar/ocultar contraseña actual, nueva y confirmación; verificar con pruebas que cada control cambia solo su propio `type`, conserva su valor, tiene nombre accesible y mantiene foco operable.
- [x] 3.3 Implementar estados de carga y bloqueo contra envíos duplicados; verificar con una promesa pendiente que se realiza una sola llamada, el botón informa actividad y vuelve a estar disponible después de error.
- [x] 3.4 Implementar feedback de éxito y error mediante mecanismos existentes, limpiar los tres valores solo después de éxito y conservar posibilidad de corrección tras error; verificar mensajes visibles, limpieza posterior y ausencia de contraseñas en logs, sesión o diagnósticos.
- [x] 3.5 Cubrir reglas delegadas al backend —contraseña actual incorrecta, política inválida, contraseña nueva repetida y errores recuperables— sin duplicar reglas de dominio en frontend; verificar que se presenta el mensaje backend disponible sin exponer secretos.

## 4. US-PROFILE-04 — Responsive y accesibilidad

- [ ] 4.1 Ajustar composición mobile-first de cabecera, cuenta y seguridad con tokens existentes; verificar manualmente en 375, 768, 1280 y 1440 px que no hay desplazamiento horizontal inesperado, el correo largo se adapta y las acciones mantienen jerarquía.
- [ ] 4.2 Verificar navegación completa por teclado, foco visible, orden de tabulación, nombres de controles, asociación de errores y semántica de formulario; cubrir con pruebas automatizadas de accesibilidad disponibles y una revisión manual reproducible.
- [x] 4.3 Verificar que las rutas `/profile` y `/app/profile` siguen renderizando la misma experiencia y que las pantallas protegidas mantienen el comportamiento de autenticación; ejecutar las pruebas focalizadas de router y perfil sin alterar rutas ni capacidades.

## 5. Integración y certificación

- [ ] 5.1 Verificar con flujo autenticado que un cambio exitoso respeta la revocación de sesiones existente y que la siguiente solicitud protegida se comporta según el flujo actual; registrar resultado sin cambiar backend ni introducir política frontend nueva.
- [ ] 5.2 Ejecutar `npm run lint`, `npm run check:architecture`, `npm run test -- --run`, `npm run build` desde `frontend` y `git diff --check`; registrar resultados reales, fallos y bloqueos sin declarar éxito de comandos no ejecutados.
- [x] 5.3 Revisar diff final para confirmar que el incremento se limita a perfil, transporte frontend y pruebas relacionadas, sin dependencias nuevas, cambios backend, Prisma, migraciones, RBAC, rutas globales o trabajos ajenos; verificar estado Git y alcance antes de solicitar revisión.

## Trazabilidad

- El incremento implementa `profile-account-security` y las historias `US-PROFILE-01` a `US-PROFILE-04` descritas en la propuesta.
- Casos de uso V2 relacionados: `NOT_VERIFIED` localmente; ningún catálogo V2 se toma como evidencia de funcionalidad V1 ni se modifica durante este cambio.

## Workflow follow-up

- Revisar artefactos y resultado visual antes de autorizar commit o PR.
- Archivar el cambio solo después de completar Apply, validación y revisión del proyecto.
