---
name: sgi-frontend-architecture
description: Guiar la organización mantenible del frontend SGI-Curime. Usar al crear, mover o revisar componentes, layouts, páginas, servicios, configuración de navegación, tipos y utilidades.
---

# Arquitectura frontend de SGI-Curime

## Propósito

Evitar que el frontend vuelva a crecer de forma desordenada y favorecer componentes reutilizables con responsabilidades claras.

## Autoridad

`frontend/CONVENTIONS.md` define la arquitectura operativa, los límites automatizados y los tokens frontend. Esta skill guía decisiones de estructura dentro de ese contrato; no lo reemplaza.

## Organización vigente

La dirección de dependencias es:

```text
app → features → shared
```

```text
src/
├── app/                    composición, providers, router, layouts y estado global
├── features/<domain>/      API, modelos, hooks, UI y routing propios del dominio
│   └── index.ts            única API pública para app u otras features
└── shared/                 HTTP, sesión, seguridad, utilidades y UI sin dominio
```

Las raíces `pages/`, `services/`, `types/`, `components/` y `content/` son legacy: `NO_NEW_CODE`, salvo excepción documentada o migración autorizada. No crear una organización horizontal nueva como destino arquitectónico.

## Reglas

- Favorecer componentes reutilizables y enfocados.
- Evitar componentes gigantes.
- Mantener la lógica y tipos de dominio dentro de su feature; mover a `shared/` solamente conceptos realmente independientes del dominio.
- Importar otra feature únicamente desde su `index.ts` público; `shared/` no depende de `app/` ni de features.
- Mantener datos de servidor en TanStack Query y no duplicarlos en estado local o stores.
- Evitar navegación hardcodeada y repetida, sin inventar rutas, capacidades o módulos.
- Centralizar la evaluación de permisos según contratos existentes; visibilidad frontend nunca reemplaza autorización backend.
- Evitar estilos inline innecesarios.
- Mantener la lógica de negocio fuera del JSX.
- Evitar duplicar helpers.
- Integrar los cambios con la arquitectura existente sin reorganizaciones especulativas.

## Configuración de navegación

Cuando corresponda implementarla, la configuración debe poder expresar conceptualmente:

- `label`
- `route`
- `icon`
- capacidades o restricciones de acceso ya definidas por el contrato
- `children`
- `enabled`

No implementar esta configuración hasta que la tarea correspondiente lo solicite. La navegación protegida debe respetar rutas explícitas, capabilities vigentes y la autoridad server-side; no mostrar funcionalidades que el usuario no puede utilizar.
