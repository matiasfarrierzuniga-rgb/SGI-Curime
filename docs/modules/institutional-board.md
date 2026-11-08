# Junta Directiva institucional

Estado: primera vertical administrativa vigente.

`GovernanceTerm` conserva períodos históricos y el scalar físico mapeado `institutionalProfileId` del singleton `OrganizationProfile`. Sus fechas son explícitas. `GovernanceMembership` vincula período, datos físicos legados de persona/cargo y enlaces Target opcionales a `GovernancePosition` y `Affiliate`; plaza y overrides son opcionales. Sin overrides, rigen las fechas del período.

**Mapping note:** `GovernanceTerm` and `GovernanceMembership` are the V1.1
Prisma logical models. They preserve physical mappings to `BoardTerm` and
`BoardAppointment` respectively through Prisma `@@map`; they are not duplicate
logical roots. Historical field/link reconciliation remains deferred, so the
physical table names and mapped legacy columns stay in place.

`Person` es la identidad canónica: no se copian datos personales, no se crean personas y no se depende de `User` o `Affiliate`. `Role` autoriza funciones; `GovernancePosition` describe el cargo y nunca se infiere del rol. Cargos: `PRESIDENT`, `VICE_PRESIDENT`, `SECRETARY`, `TREASURER`, `VOCAL`, `FISCAL`, `SUPLENTE`.

No hay DELETE. Una sustitución cierra el nombramiento anterior y crea otro, conservando ambos. Se valida orden de fechas y se rechaza un override solo si queda completamente fuera del período; una intersección parcial es válida.

El backend conserva `personId` en PATCH únicamente para una eventual corrección administrativa de captura. El formulario normal de edición no permite cambiar Persona: una sustitución debe cerrar la vigencia del nombramiento anterior y crear una fila nueva para la nueva persona.

La autorización proviene de capacidades persistidas, no del label de software role ni del cargo. En el baseline RBAC V2.3 vigente, Secretaría tiene `adm.institutional-board.read/manage` para consultar y mantener períodos y nombramientos; System Administrator conserva lectura técnica cuando su grant efectivo lo permite. La búsqueda específica devuelve id, nombre, tipo y últimos cuatro caracteres de identificación; excluye nacimiento, domicilio y contacto. Escrituras y auditoría son atómicas. Acciones actuales: `BOARD_TERM_CREATED/UPDATED` y `BOARD_APPOINTMENT_CREATED/UPDATED/REVOKED`; se guardan ids y `changedFields`, no PII.

Finalizar, sustituir o corregir un nombramiento preserva `Person`, `User`, `Affiliate`, `User.personId` y el historial `GovernanceMembership`. El cargo nunca asigna o revoca automáticamente permisos ERP. La revisión explícita de privilegios administrativos tras estos cambios está **PENDIENTE DE IMPLEMENTACIÓN** en el cambio RBAC V2.3; no debe asumirse como completada ni como eliminación de autorizaciones legítimas.

El acceso a la pantalla no certifica el formulario “Agregar nombramiento”. Permanecen pendientes de corrección funcional: disponibilidad del botón según capacidad, selección y proyección autorizada de Person, guardado, feedback visible, actualización del listado y recuperación de controles tras la solicitud.

## VALIDATION_PENDING

Afiliación/estado; duración y solapamiento; máximos u obligatoriedad de cargos; incompatibilidades; Asamblea; reglas estatutarias; resolución; nombramiento total/parcial; estados/workflow; evidencia, firma, sello, publicación e integración DINADECO.

**Cutover deferred:** physical renaming and retirement of mapped legacy fields
remain outside the completed structural implementation. `Person`/`Affiliate`
identity enforcement remains governed by `ID-01`; do not remove mappings or
legacy columns without evidence-backed cutover.
