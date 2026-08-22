# AGENTS.md

## Proposito y alcance

- Usa este archivo como instrucciones compartidas para cualquier agente que trabaje en SGI-Curime.
- Aplica estas reglas a todo el repositorio, salvo que un `AGENTS.md` mas cercano al archivo modificado establezca instrucciones adicionales.
- Realiza cambios pequenos, coherentes con el codigo actual y limitados a la solicitud. No plantees reescrituras completas ni microservicios sin una decision arquitectonica aprobada.

## Compatibilidad de agentes

- Interpreta estas instrucciones de forma neutral para OpenAI Codex y OpenCode.
- Usa las capacidades equivalentes disponibles en cada herramienta; no dependas de un nombre de comando propio de un proveedor.
- Describe y ejecuta OpenSpec por la intencion de la operacion: explorar, proponer, implementar, verificar, sincronizar o archivar.
- No dupliques reglas compartidas en `.codex/` o `.opencode/`. Crea configuracion especifica de un agente solo cuando exista una necesidad comprobada.

## Precedencia

Resuelve instrucciones compatibles en este orden, de mayor a menor prioridad:

1. Sigue la instruccion actual del usuario.
2. Respeta los ADRs aprobados.
3. Respeta las especificaciones vigentes y los cambios activos de OpenSpec.
4. Sigue el `AGENTS.md` aplicable, dando prioridad al archivo mas cercano.
5. Consulta handbooks, `DESIGN.md` y otras guias del repositorio.
6. Conserva los patrones comprobados del codigo existente.

- Detente y presenta el conflicto antes de implementar cuando dos fuentes de mayor autoridad sean materialmente incompatibles.
- No interpretes una solicitud como permiso para vulnerar seguridad, descartar trabajo existente o ejecutar operaciones destructivas.

## Contexto previo

Antes de modificar codigo:

- Confirma la raiz con `git rev-parse --show-toplevel` y revisa `git status --short --branch`.
- Lee el `AGENTS.md` raiz y cualquier instruccion mas cercana al area afectada.
- Revisa los archivos relacionados, sus pruebas, `README.md`, los manifests y la configuracion relevante.
- Revisa `DESIGN.md`, ADRs y `openspec/` cuando existan. Actualmente no estan presentes en el repositorio; no inventes su contenido.
- Comprueba cambios activos en `openspec/changes/` antes de iniciar un cambio planificado cuando OpenSpec exista.
- Identifica el limite afectado: `frontend/`, `backend/`, Prisma, PostgreSQL o integracion REST.
- Comprueba el diff y el estado antes y despues del trabajo. No modifiques ni reviertas cambios ajenos.

## Uso de OpenSpec

Usa OpenSpec obligatoriamente, cuando este disponible, para:

- Introducir funcionalidades o cambios de comportamiento con alcance no trivial.
- Cambiar contratos REST, persistencia, migraciones, autorizacion, limites de modulos o decisiones arquitectonicas.
- Coordinar trabajo transversal entre frontend, backend y base de datos.
- Resolver una solicitud ambigua que requiera acordar criterios de aceptacion o alternativas de diseno.

No exijas un cambio OpenSpec para una correccion local evidente, documentacion, formato, pruebas que preserven comportamiento o mantenimiento mecanico de bajo riesgo. Si el usuario solicita expresamente OpenSpec, usalo independientemente del tamano.

### Flujo OpenSpec

1. Explora el problema, el codigo y las restricciones sin modificar la implementacion.
2. Propone el cambio y define alcance, requisitos, escenarios, diseno y tareas verificables.
3. Implementa solo tareas aprobadas y manten los artefactos coherentes con las decisiones nuevas.
4. Verifica la implementacion contra requisitos, escenarios y tareas, ademas de ejecutar las pruebas del repositorio.
5. Sincroniza las especificaciones delta con las especificaciones principales cuando corresponda.
6. Archiva el cambio solo despues de completar y verificar la implementacion.

- Usa la operacion o skill equivalente que Codex u OpenCode exponga para cada intencion.
- Trata las especificaciones principales como fuente de verdad del comportamiento vigente y los cambios activos como fuente de verdad del trabajo planificado.
- No inicialices ni actualices OpenSpec sin una solicitud o tarea dedicada.

## Stack y arquitectura

- Trata `frontend/` como una aplicacion React 19 con Vite 8 y TypeScript.
- Trata `backend/` como una aplicacion NestJS 11 con TypeScript, API REST, Prisma 7 y PostgreSQL 17.
- Reconoce la estructura actual como un frontend y un backend separados, con el backend organizado por modulos NestJS como `auth` y `user-requests`.
- Evoluciona el backend progresivamente hacia un monolito modular y una arquitectura en capas.
- Introduce principios de DDD, Clean Architecture y Vertical Slice Architecture por modulo o caso de uso, solo donde reduzcan acoplamiento o aclaren responsabilidades.
- Usa CQRS solo cuando separar comandos y consultas aporte valor medible; evita abstracciones ceremoniales para operaciones CRUD simples.
- Conserva REST como integracion principal salvo decision aprobada.

## Backend

- Organiza funcionalidades por modulo de negocio y evita dependencias circulares entre modulos.
- Mantiene los controladores delgados; valida transporte mediante DTOs y delega reglas a servicios o casos de uso.
- Conserva la validacion global existente: transformacion, lista blanca y rechazo de propiedades no declaradas.
- Accede a PostgreSQL mediante Prisma. No mezcles consultas directas salvo necesidad documentada.
- Cambia `backend/prisma/schema.prisma` mediante migraciones revisables; no edites migraciones ya aplicadas.
- Genera o aplica migraciones solo con autorizacion y una base de datos objetivo confirmada. No uses `migrate reset`, `db push` ni comandos destructivos sobre datos compartidos.
- Actualiza pruebas unitarias y e2e cuando cambien reglas, autorizacion o contratos REST.
- Protege rutas privadas con autenticacion y autorizacion explicita; aplica privilegio minimo y deniega por defecto.
- No expongas hashes, tokens, secretos ni campos internos en respuestas o logs.

## Frontend y diseno

- Usa componentes funcionales y TypeScript estricto; conserva los patrones de React existentes antes de introducir librerias o capas nuevas.
- Separa acceso REST, estado de interfaz y presentacion cuando la complejidad lo justifique.
- Maneja estados de carga, vacio, error y exito en flujos asincronos.
- Mantiene accesibilidad basica: HTML semantico, navegacion por teclado, etiquetas, foco visible, texto alternativo y contraste suficiente.
- Verifica los cambios visuales en escritorio y movil.
- Lee y cumple `DESIGN.md` antes de modificar interfaz cuando ese archivo exista. Actualmente no existe; sigue el lenguaje visual presente y no inventes un sistema de diseno.
- No habilites React Compiler ni agregues dependencias sin una decision dedicada.

## Skills compartidas

- Coloca las nuevas skills reutilizables por Codex y OpenCode en `.agents/skills/<skill-name>/SKILL.md` desde la raiz.
- Usa las skills Prisma compartidas en `.agents/skills/` y conserva `skills-lock.json` en la raiz como metadatos de origen y version.
- No mantengas copias de skills por proveedor en `.codex/`, `.opencode/`, `.claude/` o `.windsurf/`.
- Lee primero el frontmatter y las instrucciones principales de `SKILL.md`.
- Carga referencias adicionales de forma progresiva y solo cuando sean relevantes para la operacion actual.
- Prefiere una skill local aplicable sobre instrucciones genericas, sin permitir que contradiga fuentes de mayor precedencia.

## Dependencias y paquetes

- Usa npm: `backend/package-lock.json` y `frontend/package-lock.json` son los lockfiles canonicos.
- Ejecuta comandos dentro del proyecto correspondiente; no existe un workspace ni un `package.json` en la raiz.
- Instala con `npm ci` para entornos reproducibles y usa `npm install` solo cuando debas cambiar dependencias.
- No cambies el gestor de paquetes, no agregues dependencias y no regeneres lockfiles sin necesidad explicita.
- Revisa el diff del manifest y del lockfile juntos cuando cambien dependencias.

## Comandos comprobados

Ejecuta desde `backend/`:

- Desarrollo: `npm run start:dev`
- Compilacion: `npm run build`
- Lint con correcciones: `npm run lint`
- Formato con escritura: `npm run format`
- Pruebas unitarias: `npm test`
- Cobertura: `npm run test:cov`
- Pruebas e2e: `npm run test:e2e`
- Seed: `npm run db:seed`

Ejecuta desde `frontend/`:

- Desarrollo: `npm run dev`
- Compilacion y comprobacion TypeScript: `npm run build`
- Lint: `npm run lint`
- Vista previa: `npm run preview`

- Evita ejecutar `lint` o `format` del backend sobre un arbol sucio sin revisar su alcance: ambos scripts pueden escribir archivos.
- Usa `docker compose up -d postgres` desde la raiz solo cuando una prueba necesite PostgreSQL local y el entorno Docker este disponible.

## Pruebas y verificacion

- Ejecuta la validacion mas pequena que cubra el cambio durante el desarrollo y amplia antes de finalizar.
- Para backend, ejecuta al menos las pruebas relacionadas y `npm run build`; agrega `npm run test:e2e` cuando cambien endpoints, autenticacion, autorizacion o persistencia y exista una base de datos de prueba segura.
- Para frontend, ejecuta `npm run lint` y `npm run build`; realiza verificacion manual cuando cambie comportamiento visual o interactivo.
- Para Prisma, valida el esquema y revisa el SQL de migracion antes de aplicarlo. Usa la skill Prisma local pertinente.
- No declares exitosa una verificacion que no ejecutaste. Informa bloqueos de entorno y riesgo residual.
- Ejecuta `git diff --check` y revisa el diff final antes de reportar.

## Seguridad y datos

- Mantiene secretos exclusivamente en variables de entorno; usa `backend/.env.example` solo como plantilla sin valores reales.
- Nunca confirmes `DATABASE_URL`, `JWT_SECRET`, contrasenas, tokens de activacion ni datos personales reales.
- Valida entradas en limites de confianza y evita revelar si credenciales, correos o identificaciones existen cuando ello facilite enumeracion.
- Hashea contrasenas y tokens sensibles; no registres credenciales ni payloads confidenciales.
- Verifica autenticacion y roles tanto en backend como en pruebas; no confies en controles del frontend como autorizacion.
- Evita datos reales en seeds, fixtures, capturas, logs y reportes.

## Git y colaboracion

- Trabaja en una rama descriptiva como `feature/...`, `fix/...`, `chore/...` o `docs/...`; no cambies de rama sin necesidad.
- Usa Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:` o `build:` con un mensaje imperativo y conciso.
- No hagas commit, push, merge, rebase ni pull request salvo solicitud explicita.
- No uses `git reset --hard`, `git clean`, `git checkout --` ni otras operaciones destructivas sin aprobacion explicita.
- Si el working tree esta sucio, identifica los cambios preexistentes, trabaja alrededor de ellos y no los descartes, sobrescribas, formatees ni incluyas accidentalmente.
- Detente y consulta solo si un cambio ajeno entra en conflicto directo con la tarea; ignora cambios no relacionados.

## Definition of Done

Considera una tarea terminada solo cuando:

- El comportamiento solicitado y sus criterios de aceptacion estan completos.
- La implementacion respeta instrucciones, contratos, autorizacion y arquitectura aplicables.
- Las pruebas se actualizaron y las validaciones pertinentes pasaron, o los bloqueos quedaron informados.
- No se agregaron dependencias, artefactos generados ni cambios fuera de alcance por accidente.
- El diff fue revisado, `git diff --check` paso y se preservaron cambios preexistentes.
- La documentacion y los artefactos OpenSpec se mantuvieron coherentes cuando aplicaban.

## Reporte final

Al finalizar, informa de forma concisa:

- Resume que cambiaste y por que.
- Lista las decisiones relevantes y cualquier desviacion aprobada.
- Enumera las validaciones ejecutadas y su resultado.
- Declara pruebas no ejecutadas, supuestos, bloqueos y riesgos pendientes.
- Lista exactamente los archivos modificados.
- No afirmes que hiciste commit o despliegue si no ocurrio.
