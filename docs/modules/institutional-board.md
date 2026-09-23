# Junta Directiva institucional

Estado: primera vertical administrativa vigente.

`BoardTerm` conserva períodos históricos vinculados al singleton `InstitutionalProfile`. Sus fechas son explícitas. `BoardAppointment` vincula período, `Person` existente y `BoardPosition`; plaza y overrides son opcionales. Sin overrides, rigen las fechas del período.

`Person` es la identidad canónica: no se copian datos personales, no se crean personas y no se depende de `User` o `Affiliate`. `Role` autoriza funciones; `BoardPosition` describe el cargo y nunca se infiere del rol. Cargos: `PRESIDENT`, `VICE_PRESIDENT`, `SECRETARY`, `TREASURER`, `VOCAL`, `FISCAL`, `SUPLENTE`.

No hay DELETE. Una sustitución cierra el nombramiento anterior y crea otro, conservando ambos. Se valida orden de fechas y se rechaza un override solo si queda completamente fuera del período; una intersección parcial es válida.

El backend conserva `personId` en PATCH únicamente para una eventual corrección administrativa de captura. El formulario normal de edición no permite cambiar Persona: una sustitución debe cerrar la vigencia del nombramiento anterior y crear una fila nueva para la nueva persona.

Solo Administrador recibe `adm.institutional-board.read/manage`. La búsqueda específica devuelve id, nombre, tipo y últimos cuatro caracteres de identificación; excluye nacimiento, domicilio y contacto. Escrituras y auditoría son atómicas. Acciones: `BOARD_TERM_CREATED/UPDATED` y `BOARD_APPOINTMENT_CREATED/UPDATED`; se guardan ids y `changedFields`, no PII.

## VALIDATION_PENDING

Afiliación/estado; duración y solapamiento; máximos u obligatoriedad de cargos; incompatibilidades; Asamblea; reglas estatutarias; resolución; nombramiento total/parcial; estados/workflow; evidencia, firma, sello, publicación e integración DINADECO.
