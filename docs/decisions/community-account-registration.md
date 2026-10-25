# SGI-Curime — Contrato propuesto: registro comunitario de autoservicio

- **Estado:** PROPOSED — análisis funcional; NO IMPLEMENTADO / NO APROBADO COMO CAMBIO PRODUCTIVO.
- **Tipo:** Decisión transversal de identidad, autenticación, permisos y experiencia comunitaria.
- **Referencia técnica AS-IS:** SGI-Curime V1 en `main@52361bedd4a66c1069a1d944380f528792bf215f` (PR #114). Volver a auditar al comenzar APPLY.
- **Referencia de requisitos:** especificación V2 v0.1 (13-10-2026), 15 DCU y 155 CU; documento en revisión, no código V1 ni aprobación institucional.
- **Proceso de trabajo:** OpenSpec EXPLORE -> PROPOSE -> APPLY -> VERIFY -> ARCHIVE; APPLY solo tras autorización explícita.

## Problema y objetivo

AS-IS: el formulario público `/register` crea `UserRequest(PENDING)` y espera revisión. Un operador con `usr.user-requests.review` aprueba una solicitud vinculando una `Person` preexistente, eligiendo rol activo y creando `User(INACTIVE)` más token. El usuario recibe un enlace, fija contraseña y activa su cuenta. Solicitudes no vinculables a `Person` existente quedan bloqueadas para revisión institucional.

TO-BE: cualquier persona elegible puede abrir una **cuenta comunitaria básica** con nombre, correo y contraseña, confirmar control del buzón mediante enlace temporal y activar su cuenta, sin esperar aprobación de la Junta Directiva. Conservar controles separados para afiliación, emprendimientos, acceso administrativo y representación institucional.

## Flujo básico objetivo (sin implementación autorizada aún)

1. Visitante abre `/register` y completa datos mínimos, acepta aviso de privacidad y envía.
2. Backend valida campos y abuso, comprobando unicidad/estado de cuenta mediante tratamiento seguro contra enumeración; registra cuenta no autenticable **pendiente de verificación**. No concede permisos privilegiados ni sesión.
3. Backend genera token criptográficamente aleatorio, guarda solo hash y vencimiento, entrega enlace al correo. Los fallos de entrega deben permitir reintento y visibilidad operativa sin imprimir el secreto.
4. Persona accede al enlace. Backend comprueba token vigente, no usado y asociado a la cuenta apropiada; lo consume atómicamente y marca el correo verificado/activa la cuenta básica.
5. Usuario inicia sesión; servidor resuelve rol comunitario mínimo y permisos persistidos; cliente abre `Mi Comunidad`. No dispone de ERP administrativo.
6. Cuenta puede iniciar una solicitud institucional independiente (afiliación, propuesta de emprendimiento, representación). Estas solicitudes conservan revisión propia.

### Casos especiales

- Correo registrado: no duplicar `User` ni divulgar estado sensible. Ofrecer login/recuperación o respuesta neutral.
- Token expirado/usado/inválido: no activar ni crear sesión; permitir regeneración segura con throttling.
- Fallo de envío: preservar consistencia y facilitar reintento sin registrar token claro.
- Carrera/reenvío múltiples: invalidación/reutilización atómica e idempotencia donde corresponda.
- Cuenta suspendida/bloqueada/inactiva por administrador: verificación de correo **no** debe levantar bloqueos administrativos.
- Identidad legal ya existente: evitar toma de control de otro registro mediante conocimiento de nombre, correo o cédula. La conciliación `Person` debe ser acreditada mediante una política segura y comprobable.
- Cuenta administrativa heredada, solicitudes históricas, tokens válidos, sesiones y roles no se eliminan ni migran destructivamente por defecto.

## Separación de identidades y autorizaciones

- `Person`: identidad física canónica, no necesariamente acreditada legalmente al registrar correo.
- `User`: cuenta y autenticación; no equivale a `Affiliate`.
- `Affiliate`: condición de afiliación decidida por proceso institucional.
- `Role`/`RolePermission`/`Permission`: acceso de software, independiente de cargos o nombramientos.
- `Venture` + `VentureAssociation`: emprendimiento y vínculos de personas; una asociación no concede por sí sola acceso técnico. Autogestión autenticada exige asociación vigente y autorización.
- `VolunteerApplication` y `VolunteerParticipation`: postulación/participación posible sin `User` y sin `Affiliate`.
- El correo verificado NO es prueba de representación de ASADA, Junta Directiva, afiliación ni titularidad de Person preexistente.

## Restricciones técnicas y decisiones abiertas (NO resolver por intuición)

- Prisma V1 actual obliga `User.identification` y tiene vínculo `personId` opcional con restricciones únicas. La decisión de pedir solo nombre+correo+contraseña exige un diseño explícito y probablemente migración, sujeto a revisión de esquema congelado, backfill, compatibilidad y rollback. Prohibido usar identificaciones ficticias.
- Decidir creación de `Person` mínima vs alta de `User` diferida, y procedimiento seguro de reconciliación con `Person/Affiliate` existentes.
- Separar estado «correo pendiente de verificar» de «inactivo por decisión administrativa». Evaluar flags/estados y política de login.
- Decidir nombre de usuario de visualización (opcional) vs login por correo. No adoptar un identificador único adicional sin aprobación.
- Decidir TTL, reenvío, límites de frecuencia, manejo de proveedor de correo, recuperación, cuentas duplicadas y observabilidad.
- Determinar rol comunitario mínimo en catálogo y seed reales sin ampliar automáticamente `erp.dashboard.read` ni otras capacidades administrativas.
- Resolver transición de `/register`, `UserRequest` y componentes anteriores sin romper solicitudes pendientes ni consumidores.
- Determinar si mantener CU-21 solo para revisión especial o abrir otro CU formal, sin renumerar el catálogo 155.

## Trazabilidad propuesta a casos de uso V2

- **CU-20:** proponer cambio de «Solicitar una cuenta de usuario» a «Registrar cuenta comunitaria».
- **CU-21:** replantear alcance de revisión de cuentas privilegiadas/excepciones; no aplica a cuenta comunitaria estándar.
- **CU-22:** proponer cambio de «Activar una cuenta aprobada» a «Verificar correo y activar cuenta» sin sesión previa.
- **CU-01, CU-23 a CU-27, CU-28 a CU-31:** mantener y revisar login, recuperación, perfil, cuentas y seguridad.
- **CU-04 / CU-05:** solicitud de afiliación y aprobación, independientes del registro comunitario.
- **CU-121:** voluntariado puede solicitarse sin cuenta.
- **CU-11, CU-126 a CU-134:** emprendimiento, revisión, asociación, publicación/autogestión; no requieren condición de afiliado según modelo V2.

## Criterios mínimos de aceptación para APPLY

1. Usuario nuevo puede registrarse con campos mínimos aprobados y obtiene cuenta no autenticable hasta verificar email.
2. Token expirado, reutilizado o inválido no activa; los reenvíos se controlan y no crean privilegios.
3. Cuenta verificada inicia sesión, accede a su perfil y no al ERP administrativo.
4. No se crean `Affiliate`, `VentureAssociation`, puesto de Junta Directiva ni permisos privilegiados por autorregistro.
5. No se exponen datos privados ajenos mediante conciliación automática de identidad.
6. Voluntariado sigue disponible sin cuenta; las postulaciones tienen flujo institucional separado.
7. Solicitudes históricas, cuentas administrativas y tokens válidos existentes continúan siendo compatibles.
8. Pruebas unitarias, contrato HTTP y E2E contra DB desechable (autorizadas) reportadas con resultados reales y rollback documentado.

## Fuera de alcance del primer incremento

- Terminar módulos completos de emprendimientos, afiliación, voluntariado o ERP.
- Rediseñar gobierno institucional, cargos de ADI o administración dinámica de roles/permisos.
- Introducir OAuth, autenticación de dos factores u OTP numérico sin decisión separada.
- Migrar datos reales, limpiar un worktree ajeno o reescribir documentación histórica sin autorización.

## Estado y requisito de aprobación

**Esto es un borrador compartible con el equipo, no una orden de implementar.** La revisión formal de OpenSpec deberá aceptar el contrato, decisiones abiertas, cambios de identidad/DB y pruebas antes de habilitar APPLY. Una vez aprobado, actualizar estado, referencias y trazabilidad a la versión aceptada.

## Catálogo V2 y revisiones documentales

- La trazabilidad de **CU-20**, **CU-21** y **CU-22** remite al catálogo documental V2 de 155 casos de uso. Su fuente V0.1 no está incorporada ni verificada localmente en este incremento; cualquier referencia queda `NOT_VERIFIED` hasta recibir y validar el PDF inmutable.
- El catálogo V2 no evidencia implementación, aprobación institucional ni requisitos vigentes de V1. Antes de APPLY, contrastar cada CU relacionado con código, contratos, OpenSpec y pruebas reales de V1.
- Una revisión **V0.2** de este contrato se publicará como artefacto sucesor y propuesto, con diferencias explícitas respecto a V0.1. No se reescribe silenciosamente esta versión.
