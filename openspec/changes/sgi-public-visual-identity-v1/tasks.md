# Tasks

## 1. Clasificación e inventario académico

- [x] 1.1 Crear `asset-inventory.md` dentro del cambio con P01–P04 clasificadas como `PROVISIONAL_ACADEMIC`, incluyendo ruta fuente, formato, dimensiones, orientación, uso de referencia, autoría/licencia `NOT_VERIFIED` y requisitos pendientes; verificar que ninguna figure como oficial o autorizada.
- [x] 1.2 Registrar las cinco equivalencias visuales del ZIP con los logotipos existentes y el derivado adicional del Header; verificar que el inventario indique conservación sin reemplazo ni extracción.
- [x] 1.3 Registrar P03 como referencia compositiva de About, P02 como referencia futura de Hero y P01/P04 como reservadas; verificar que estas decisiones no impliquen publicación, copia ni transformación.

## 2. Configuración visual segura de About

- [x] 2.1 Crear un descriptor tipado y local al feature público para distinguir placeholder e imagen autorizada, con campos de fuentes, fallback, dimensiones, alt, crédito y evidencia solo en la variante autorizada; verificar que no contenga rutas hacia P01–P04.
- [x] 2.2 Configurar como valor predeterminado un placeholder local basado en tokens y motivos institucionales existentes; verificar que no agregue dependencias ni activos de licencia desconocida.
- [x] 2.3 Documentar junto al descriptor la condición de sustitución por un recurso `AUTHORIZED_PUBLICATION`; verificar que procedencia, licencia/autorización, transformación y crédito sean requisitos explícitos.

## 3. Integración focalizada en About

- [x] 3.1 Actualizar únicamente el contenido interno de la figura de `AboutSection` para consumir el descriptor visual; verificar que grid, heading, texto, eslogan, CTA, destino y tokens existentes permanezcan sin cambios.
- [x] 3.2 Presentar el placeholder con mensaje neutral e información accesible, usando alt vacío para motivos decorativos; verificar que no se atribuya autoría, ubicación ni autorización a P03.
- [x] 3.3 Mantener preparada la rama de imagen autorizada con dimensiones reservadas, carga diferida, fuentes responsive, fallback, alt factual y crédito opcional; verificar mediante revisión de código que solo pueda configurarse con metadatos de autorización completos.
- [x] 3.4 Actualizar pruebas focalizadas de About/Home para preservar contenido y enlace, comprobar el placeholder predeterminado y evitar referencias a P01–P04; preparar el comando focalizado para que lo ejecute el responsable sin ejecutarlo automáticamente.

## 4. Validación académica y preparación de despliegue

- [x] 4.1 Revisar manualmente About en 320×568, 375×667, 768×1024, 1024×768 y 1440×900; verificar composición, legibilidad, contraste, foco, proporciones, estabilidad y ausencia de overflow.
  - Evidencia: QA visual responsive aprobado por el usuario en 320×568, 375×667, 768×1024, 1024×768 y 1440×900; aprobación declarada para composición, legibilidad, contraste, foco, proporciones, estabilidad y ausencia de overflow.
- [x] 4.2 Confirmar por inspección que Hero, Header, Footer, Community, Latest News, Eventos, demás módulos, rutas, contratos, dependencias y logotipos vigentes no cambiaron; verificar que ninguna ruta o recurso nuevo contenga P01–P04.
  - Evidencia: revisión focalizada de los diffs de `AboutSection.tsx` y `PublicPages.test.tsx`, más lectura de `aboutVisual.ts`; `aboutVisual` solo se importa desde `AboutSection`; búsqueda en `frontend/src` sin referencias P01–P04 ni rutas `Pictures`. El incremento queda limitado a About, su descriptor, su prueba focalizada y artefactos OpenSpec propios.
  - Observación: árbol con cambios simultáneos de Eventos, Junta Directiva e infraestructura de pruebas, además de archivos de procedencia no demostrada; se consideran fuera de este incremento y no se modificaron.
- [x] 4.3 Incorporar al inventario una lista de preparación pública con procedencia, licencia/autorización, permiso de transformación, crédito, alt y derivados; verificar que cualquier campo pendiente mantenga el placeholder como selección obligatoria.
- [x] 4.4 Solicitar al responsable ejecutar la validación frontend focalizada y registrar evidencia real como `PASSED`, `FAILED` o `NOT_EXECUTED`; verificar que no se declare aprobación técnica sin salida del comando.
  - Evidencia: `PASSED` — responsable ejecutó `npm run test -- --run src/pages/public/PublicPages.test.tsx`; Vitest 4.1.12 informó 1 archivo aprobado, 20 pruebas aprobadas, 0 fallos y setup/teardown sin errores.

## Workflow follow-up

- Si P03 u otra fotografía obtiene derechos verificables, actualizar primero su clasificación y evidencia; después preparar derivados y sustituir el placeholder mediante un Apply aprobado.
- No desplegar públicamente una fotografía provisional.
- Archivar el cambio solo después de aprobación visual y validación técnica suficiente.
