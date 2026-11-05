# Proposal

## Why

La ruta pública `/afiliacion` conserva su flujo funcional, pero su composición visual todavía difiere del wireframe aprobado de SGI-Curime. Se requiere un contrato ejecutable que permita reproducir esa referencia en una sola pasada, sin alterar validaciones, integraciones, contratos de datos ni componentes globales.

## What Changes

- Reproducir en `/afiliacion` la jerarquía, proporciones, espaciado, superficies, Stepper, distribución de campos, mensajes y acciones del wireframe aprobado.
- Definir comportamiento responsive verificable para desktop, tablet y móvil.
- Limitar la implementación a `frontend/src/pages/public/AffiliationPage.tsx`.
- Mantener sin cambios los tres pasos `Identidad → Contacto → Solicitud`, React Hook Form, Zod, `PhoneField`, `DatePicker` y el envío existente.
- Preservar íntegramente la consulta automática de Hacienda: debounce de 500 ms, caché, descarte de respuestas obsoletas, autocompletado editable y fallback manual.
- Mantener `PublicHeader`, `PublicFooter`, primitives compartidos, backend, Prisma, Auth y Finanzas fuera del alcance.
- Mantener los indicadores de obligatoriedad alineados con el esquema Zod vigente, aunque el wireframe muestre marcas distintas.

No hay cambios incompatibles de API, persistencia, autorización o rutas.

## Capabilities

### New Capabilities

- `public-affiliation-request-form`: composición visual responsive y preservación funcional del formulario público de solicitud de afiliación en `/afiliacion`.

### Modified Capabilities

- Ninguna. La capacidad existente `affiliate-requests` cubre el flujo administrativo y no cambia.

## Impact

- **Código previsto:** exclusivamente `frontend/src/pages/public/AffiliationPage.tsx`.
- **Contratos preservados:** schema y mapeo de solicitud, servicios de consulta y envío, modelo Person-first, rutas, API, tipos y estados de dominio.
- **Componentes preservados:** `PublicHeader`, `PublicFooter`, `FormField`, `PhoneField`, `DatePicker`, `Button`, `Input`, `Select` y `Textarea`; solo se usarán composición y clases locales permitidas desde la página.
- **Dependencias:** no se agregan paquetes ni tokens globales.
- **Trazabilidad V1:** implementación actual de `AffiliationPage.tsx` y pruebas existentes de `AffiliationPage.test.tsx` son evidencia base, sin afirmar validación de este cambio.
- **Trazabilidad V2:** casos de uso relacionados quedan `NOT_VERIFIED` hasta disponer y cotejar la fuente inmutable del catálogo V2; no se inventan identificadores CU.
