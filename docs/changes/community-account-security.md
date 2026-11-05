# Seguridad del registro comunitario

Estado: implementación local; validación en curso. CU V2 relacionados: CU-01, CU-20, CU-22 y CU-23 a CU-27, referencias NOT_VERIFIED hasta validar el catálogo inmutable.

Alcance: respuestas de registro neutrales; recuperación solo para cuentas activas; invalidación de recuperación al corregir correo o desactivar; verificación comunitaria explícita; bloqueo de roles mientras está pendiente; revocación de sesiones y corte de JWT al desactivar. No cambia afiliaciones ni cargos.

Históricos: una cuenta comunitaria inactiva sin evidencia explícita debe reverificar su correo antes de reactivarse, según decisión del usuario. Un administrador con la capacidad de ciclo de vida inicia el proceso mediante POST /community-accounts/:id/reverify; la cuenta pasa a pendiente y vuelve a definir contraseña en el enlace. No hay backfill ni transición masiva. El flujo de activación administrativa histórica se conserva para roles no comunitarios.

Base de datos: la migración 20261103140000 agrega dos fechas anulables y `sessionGeneration INTEGER NOT NULL DEFAULT 0` a User, sin actualizar filas existentes. El despliegue exige migración aprobada y respaldo. La reversión de código debe considerar que borrar las columnas perdería evidencia y cortes de sesiones; se prefiere reparación hacia adelante.

Seguridad: la corrección y la activación preservan transacciones serializables; los tokens de recuperación se invalidan con el cambio de correo. Al desactivar, se incrementa `sessionGeneration`; los JWT nuevos llevan esa generación y el guard compara contra el valor persistido. Los JWT históricos sin claim siguen siendo válidos solo mientras la generación sea cero, hasta que la cuenta se desactive por primera vez. `sessionsInvalidBefore` se conserva como dato legado, pero no decide la validez del JWT. La entrega de correos públicos se inicia sin esperar al proveedor y recuperación tiene límite por cliente; no se ha medido resistencia temporal y el envío en proceso no es un outbox durable.

Arnés: suites heredadas con borrados generales deshabilitadas hasta verificar propiedad de la base; limpieza de recursos temporales solo por IDs, etiquetas y red verificada, sin eliminar volúmenes. Proveedor de correo simulado en pruebas; la entrega real requiere configuración y validación separadas.
