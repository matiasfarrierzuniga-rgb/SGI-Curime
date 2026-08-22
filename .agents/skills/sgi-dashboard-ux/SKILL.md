---
name: sgi-dashboard-ux
description: Guiar la arquitectura de navegación, dashboards y acceso por roles del frontend SGI-Curime. Usar al crear o revisar AppShell, sidebar, menús, dashboards y navegación autenticada.
---

# UX del dashboard de SGI-Curime

## Principio central

El sidebar representa dominios o módulos principales, no cada pantalla interna. Cada módulo debe proporcionar su propia navegación secundaria.

Por ejemplo, mostrar `Inventario` como módulo principal y colocar dentro de su navegación secundaria `Resumen`, `Artículos`, `Categorías`, `Movimientos`, `Préstamos`, `Alertas` y `Reportes`. No presentar todas esas pantallas como módulos independientes del sidebar. Aplicar el mismo criterio a todos los dominios.

## Estructura deseada

- Dashboard.
- Gestión administrativa: Usuarios, Afiliados, Solicitudes y Asambleas.
- Operación: Inventario y, cuando exista, Reservas.
- Gestión financiera: Finanzas, DINADECO y Donaciones cuando existan.
- Comunidad: Voluntariado y Emprendimientos cuando existan.
- Información: Reportes y estadísticas cuando existan, y Bitácora.
- Cuenta: Mi perfil, Ver sitio público y Cerrar sesión.

## Reglas de navegación y datos

- No mostrar funcionalidades no implementadas como si estuvieran disponibles.
- No inventar métricas ni usar números falsos como decoración.
- Hacer que el dashboard sea un resumen, no una lista gigante de enlaces.
- Agrupar por dominio y mantener una navegación consistente.
- Obtener todo dato mostrado de una fuente real.

El dashboard administrativo puede contener métricas reales, solicitudes pendientes, usuarios, afiliados, alertas relevantes, accesos rápidos y actividad reciente cuando exista un endpoint real que la proporcione.

## Acceso por roles

- Administrador: acceso a los módulos administrativos implementados.
- Gestor de Inventario: dashboard reducido, Inventario, Perfil, Ver sitio público y Cerrar sesión.
- Tesorero: solamente los módulos permitidos cuando estén implementados.
- Vecino/Afiliado: solamente las funciones autorizadas.

Nunca mostrar navegación que el usuario no pueda utilizar.

## Acceso al sitio público

Las pantallas `/login`, `/register`, `/forgot-password`, `/reset-password` y `/activate-account` deben tener una acción visible `Volver al sitio` que navegue a `/`.

El área interna debe proporcionar `Ver sitio público` sin exigir que el usuario cierre sesión. Aplicar esta regla al implementar el nuevo AppShell.
