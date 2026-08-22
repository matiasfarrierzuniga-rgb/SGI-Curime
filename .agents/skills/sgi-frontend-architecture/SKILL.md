---
name: sgi-frontend-architecture
description: Guiar la organización mantenible del frontend SGI-Curime. Usar al crear, mover o revisar componentes, layouts, páginas, servicios, configuración de navegación, tipos y utilidades.
---

# Arquitectura frontend de SGI-Curime

## Propósito

Evitar que el frontend vuelva a crecer de forma desordenada y favorecer componentes reutilizables con responsabilidades claras.

## Organización conceptual

Usar como orientación, adaptándola a la estructura existente:

```text
components/
  app-shell/
  navigation/
  ui/
  forms/
  public/

layouts/
  PublicLayout
  AppLayout/AppShell

config/
  navigationConfig

pages/
  admin/
  inventory/
  public/

services/
types/
utils/
```

## Reglas

- Favorecer componentes reutilizables y enfocados.
- Evitar componentes gigantes.
- Evitar navegación hardcodeada y repetida.
- Centralizar la lógica de permisos en lugar de distribuirla por muchos componentes.
- Evitar estilos inline innecesarios.
- Mantener la lógica de negocio fuera del JSX.
- Evitar duplicar helpers.
- Integrar los cambios con la arquitectura existente sin reorganizaciones especulativas.

## Configuración de navegación

Cuando corresponda implementarla, la configuración debe poder expresar conceptualmente:

- `label`
- `route`
- `icon`
- `roles`
- `children`
- `enabled`

No implementar esta configuración hasta que la tarea correspondiente lo solicite.
