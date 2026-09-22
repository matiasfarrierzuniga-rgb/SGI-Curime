# Perfil institucional

## Propósito

`InstitutionalProfile` es la fuente canónica de los datos legales e institucionales de la única Asociación administrada por esta instalación de SGI-Curime. `FinancialMovement` continúa siendo la fuente financiera. El contenido de `publicSiteContent.ts` es branding y contenido público, no una fuente legal.

## Persistencia y singleton

La tabla mantiene una sola fila, con `id = 1`, protegida por clave primaria y un `CHECK (id = 1)`. La migración crea la fila inicial sin valores legales; todos los campos institucionales son nullable. La existencia de la fila significa `MODEL_AVAILABLE`, no que los datos hayan sido capturados o validados.

`organizationType` admite únicamente `INTEGRAL` y `SPECIFIC`, conforme a los documentos analizados.

## API y autorización

| Método | Ruta | Capability | Propósito |
| --- | --- | --- | --- |
| GET | `/institutional-profile` | `adm.institutional-profile.read` | Consultar el singleton |
| PATCH | `/institutional-profile` | `adm.institutional-profile.update` | Actualizar parcialmente el singleton |

Ambas capabilities están asignadas únicamente a Administrador. No existe `POST` ni CRUD de múltiples organizaciones. Cada solicitud de actualización registra `INSTITUTIONAL_PROFILE_UPDATED` con actor, contexto de solicitud y nombres de campos modificados, sin duplicar sus valores en auditoría.

## Administración frontend

La ruta `/app/admin/institutional-profile` permite al Administrador capturar o limpiar los campos opcionales. No precarga datos desde el sitio público. Los valores legales deben ser confirmados conscientemente por la ADI.

## Consumo por DINADECO

El reporte anual DINADECO consume internamente los trece campos institucionales mediante una lectura read-only dentro del mismo snapshot financiero `RepeatableRead`. Los datos aparecen en `data.institutionalProfile`; los valores `null` se preservan y significan que el dato continúa pendiente de captura o validación.

Este consumo no amplía las capabilities administrativas: Administrador y Tesorero pueden recibir la identidad institucional como parte del reporte mediante `fin.dinadeco.read`, pero solo Administrador conserva acceso a los endpoints y la pantalla administrativa del perfil.

`InstitutionalProfile` es la fuente institucional y `FinancialMovement` continúa siendo la fuente financiera. En la metadata DINADECO, `dataSource: FINANCIAL_MOVEMENT` describe exclusivamente esa fuente financiera.

## Límites de esta fase

La integración no constituye un formulario oficial completo, conciliación bancaria, firma, sello, exportación oficial ni envío a DINADECO. Junta Directiva, representación legal, nombramientos, vigencias, firmas, sellos, anexos bancarios y conciliación permanecen fuera de alcance.
