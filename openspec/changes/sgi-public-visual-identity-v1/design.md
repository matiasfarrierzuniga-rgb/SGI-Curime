# Design

## Context

`LandingPage` renderiza `AboutSection` dentro de `PublicLayout`. About ya contiene una región `figure` con proporción 3:2 en tablet y 5:6 en escritorio, pero actualmente comunica que la fotografía está pendiente de autorización. Véase `proposal.md` para la motivación y `specs/public-visual-identity/spec.md` para el contrato.

SGI-Curime es actualmente un prototipo académico. Las fotografías inspeccionadas provienen de búsquedas web, no contienen metadatos útiles de autoría o copyright y no cuentan con licencias verificadas. Su disponibilidad local no prueba procedencia, titularidad ni permiso de publicación o transformación.

Fuentes inspeccionadas:

- Fotografías: `C:\Users\Estudiantes UNA\Pictures\imgs`
- Logotipos suministrados: `C:\Users\Estudiantes UNA\Pictures\sgi-logos.zip`

### Inventario fotográfico

| ID | Formato | Dimensiones | Orientación | Clasificación | Decisión V1 |
| --- | --- | --- | --- | --- | --- |
| P01 | JPG | 3000×2000 | Horizontal 3:2 | `PROVISIONAL_ACADEMIC` | Reservada; no publicar |
| P02 | JPG | 1940×1169 | Horizontal 1.66:1 | `PROVISIONAL_ACADEMIC` | Referencia futura de Hero; no implementar |
| P03 | JPG | 1500×999 | Horizontal 3:2 | `PROVISIONAL_ACADEMIC` | Referencia compositiva de About; no copiar ni publicar |
| P04 | JPG | 1200×675 | Horizontal 16:9 | `PROVISIONAL_ACADEMIC` | Reservada; no publicar |

P03 se mantiene como referencia por su paisaje horizontal, árbol central, ganado y fondo montañoso. Esa selección describe aptitud compositiva, no origen geográfico, oficialidad, autoría ni derechos.

### Inventario de marca

| Entrada del ZIP | Dimensiones | Equivalente existente |
| --- | --- | --- |
| `WhatsApp Image 2026-08-30 at 3.17.09 PM (1).jpeg` | 1254×1254 | `adi-curime-logo-vertical-monochrome.png` |
| `WhatsApp Image 2026-08-30 at 3.17.09 PM.jpeg` | 1254×1254 | `adi-curime-logo-vertical-color.png` |
| `WhatsApp Image 2026-08-30 at 3.17.10 PM (1).jpeg` | 1448×1086 | `adi-curime-logo-horizontal-color.png` |
| `WhatsApp Image 2026-08-30 at 3.17.10 PM (2).jpeg` | 1254×1254 | `adi-curime-seal-color.png` |
| `WhatsApp Image 2026-08-30 at 3.17.10 PM.jpeg` | 1254×1254 | `adi-curime-mark-color.png` |

Los logotipos actuales permanecen sin cambios. `adi-curime-logo-horizontal-color-header-tight.png` sigue siendo el derivado específico del Header y no tiene equivalente directo en el ZIP.

## Goals / Non-Goals

**Goals:**

- Completar la región visual de About para demostración académica sin incorporar recursos web de licencia desconocida.
- Separar selección compositiva, autorización de publicación y preparación técnica.
- Permitir reemplazar el placeholder por un activo autorizado sin reestructurar About.
- Mantener trazabilidad y una puerta explícita previa a despliegue público.

**Non-Goals:**

- Publicar, copiar o transformar P01–P04.
- Declarar P03 como fotografía oficial, local o autorizada.
- Cambiar Hero, Header, Footer, Community, Latest News, Eventos o páginas interiores.
- Sustituir, redibujar, vectorizar o reprocesar logotipos.
- Cambiar tokens, tipografías, rutas, datos, copy institucional o dependencias.
- Crear un CMS, biblioteca general de medios o configuración remota.

## Decisions

### 1. Separar estado académico de aptitud para publicación

El inventario usará dos clasificaciones:

- `PROVISIONAL_ACADEMIC`: referencia visual útil para análisis o prototipado, sin derecho de entrega pública demostrado.
- `AUTHORIZED_PUBLICATION`: activo con procedencia, licencia o autorización, transformaciones permitidas y crédito verificables.

Los requisitos pendientes de despliegue se registrarán por activo: fuente/titular, evidencia, alcance de uso, permiso de transformación, crédito, derivados y revisión final.

**Alternativa descartada:** llamar “oficial” o “local” a un recurso por su apariencia o disponibilidad. Confunde pertinencia visual con evidencia de derechos y procedencia.

### 2. Configurar About mediante un descriptor visual reemplazable

El feature público tendrá un descriptor interno y tipado para la visual de About. El descriptor distinguirá dos variantes:

- placeholder local, sin URL fotográfica ni alt engañoso;
- imagen autorizada, con fuentes responsive, fallback, dimensiones, alt, crédito opcional y referencia de evidencia.

`AboutSection` consumirá ese descriptor sin cambiar su grid, heading, texto, eslogan ni CTA. La configuración vivirá dentro de `features/public-site`, no en `src/content` legacy ni en estado de servidor.

**Alternativa descartada:** insertar una ruta de imagen directamente en About. Haría menos visible su estado de autorización y obligaría a editar la composición para reemplazarla.

### 3. Usar placeholder local como estado inicial seguro

Mientras no exista una fotografía `AUTHORIZED_PUBLICATION`, About conservará su `figure` y mostrará un placeholder institucional construido con superficies, bordes, texto neutral y motivos de marca ya presentes en el repositorio. No se descargará, copiará ni convertirá P03 para el prototipo.

El mensaje visible comunicará que la imagen publicable está pendiente de autorización, sin sugerir error técnico ni atribuir autoría. Los motivos decorativos usarán alt vacío; la explicación textual será el contenido accesible del estado.

**Alternativa descartada:** usar P03 temporalmente porque el proyecto es académico. Una referencia incluida en recursos desplegables puede terminar publicada y dificulta demostrar separación entre prototipo y entrega pública.

### 4. Mantener preparada la ruta de sustitución autorizada

Si posteriormente se autoriza una fotografía, el descriptor podrá apuntar a derivados AVIF/WebP/JPEG separados del original. About seleccionará encuadre amplio para móvil/tablet y encuadre cercano a 5:6 en escritorio, con dimensiones reservadas, `loading="lazy"`, alt factual y crédito si corresponde.

Para P03, una descripción puramente visual de referencia sería `Paisaje rural con árboles, ganado y montañas.` No se usará “Curime”, autor, fecha o ubicación hasta verificar esos datos.

**Alternativa descartada:** generar ahora derivados de P03. La transformación también requiere permiso y no forma parte del prototipo seguro.

### 5. Aplicar una puerta de despliegue público

Antes de desplegar una fotografía, la revisión deberá confirmar:

1. clasificación `AUTHORIZED_PUBLICATION`;
2. procedencia y titular o licencia;
3. autorización para publicación web;
4. autorización para recorte, compresión y formatos derivados;
5. crédito y forma de presentación;
6. alt factual aprobado;
7. derivados trazables y originales intactos.

Si falla un punto, About permanece con placeholder.

## Risks / Trade-offs

- [El placeholder reduce autenticidad visual del prototipo] → conservar proporciones, motivos y jerarquía institucional para demostrar composición sin asumir derechos.
- [La configuración parece excesiva para una sola imagen] → mantener un descriptor pequeño y local al feature; evita deuda al sustituir el activo.
- [Una fotografía provisional entra por error al bundle] → no copiar P01–P04 al repositorio y comprobar referencias antes de validación.
- [El futuro recorte autorizado pierde elementos relevantes] → validar encuadres 3:2 y 5:6 antes de sustituir el placeholder.
- [El inventario se interpreta como autorización] → mostrar clasificación y evidencia como campos separados.

## Migration Plan

1. Registrar P01–P04 como `PROVISIONAL_ACADEMIC` y documentar requisitos pendientes.
2. Introducir el descriptor visual interno con placeholder como selección predeterminada.
3. Recomponer solo el contenido interno de la figura de About mediante el descriptor.
4. Validar placeholder y composición en 320, 375, 768, 1024 y 1440 px.
5. Confirmar que ninguna ruta, recurso o markup referencia P01–P04 y que otras superficies permanecen intactas.
6. Antes de despliegue público, ejecutar la puerta de derechos; sustituir el placeholder únicamente si existe un activo autorizado.

Rollback: retirar el descriptor y restaurar el placeholder estático actual de About. No existe migración de datos, API ni backend.
