# Reglas de slices del frontend

## Propósito

Definir la arquitectura objetivo del frontend SGI-Curime: Vertical Slices por feature con capas internas mínimas. `Auth`, `Users` y `Roles` son los slices de referencia.

El frontend actual usa carpetas horizontales (`pages`, `services`, `auth`, `routes`, `components`, `types`). Se migra gradualmente a `app`/`features`/`shared` sin romper rutas, autorización ni tests existentes.

## Estructura objetivo

```text
src/
├── app/
├── features/
└── shared/
```

## Dependencias permitidas

```text
app      → features, shared
features → shared
shared   → (nada)
```

## Prohibiciones

```text
shared  ─X─► features
shared  ─X─► app
feature A ─X─► internals de feature B
features ─X─► app
```

Un feature nunca depende del interior de otro feature ni de `app`. `shared` nunca conoce a `features` ni a `app`.

## `app`

Composición global y bootstrap:

```text
src/app/
├── providers/
├── router/
├── layouts/
├── config/
└── App.tsx
```

Aquí vive:

- composición global;
- providers;
- routing;
- layouts;
- bootstrap;
- configuración global.

No se mete lógica específica de Users/Auth.

## `shared`

Conceptos verdaderamente genéricos y reutilizables:

```text
shared/
├── api/
├── ui/
├── hooks/
├── utils/
└── types/
```

Válidos:

```text
apiClient
Button
Modal
Spinner
Pagination
```

No válidos (contienen concepto de dominio):

```text
UserTable
RoleBadge
LoginForm
```

Regla: `shared` no se convierte en cajón de sastre.

## Slice de feature

Cada feature vive en `features/<feature>/` con capas internas según necesidad:

```text
features/<feature>/
├── api/
├── components/
├── hooks/
├── model/
├── pages/
└── index.ts
```

**Regla: no todos los features necesitan todas las subcapas.** Las capas se crean cuando hay responsabilidades que las justifican.

## API pública por feature

Cada slice expone un mínimo desde `index.ts`:

```typescript
export { UsersPage } from './pages/UsersPage';
export type { User } from './model/user.types';
```

Se evitan imports de internals de otro feature:

```typescript
// prohibido
import { UserStatusBadge } from '@/features/users/components/UserStatusBadge';
```

a menos que el componente sea API pública deliberada.

## Feature `auth`

```text
features/auth/
├── api/
│   ├── auth.api.ts
│   └── auth.types.ts
├── components/
├── hooks/
├── model/
├── pages/
└── index.ts
```

- La API específica (`login`, `forgotPassword`, `resetPassword`, `activateAccount`) vive en `features/auth/api/`.
- El `apiClient` genérico no se mueve dentro de Auth; queda en `shared/api/`.
- La sesión/`AuthProvider` puede vivir en `features/auth/model/` si pertenece al feature y no a la composición global. Decidir según dependencias reales.
- `LoginForm`, `PasswordRecoveryForm`, `ResetPasswordForm` se extraen de las páginas. Las páginas actúan principalmente como composición.

## Feature `users`

```text
features/users/
├── api/
│   ├── users.api.ts
│   └── users.types.ts
├── components/
│   ├── UsersTable.tsx
│   ├── UserFilters.tsx
│   ├── EditUserForm.tsx
│   ├── ChangeRoleDialog.tsx
│   └── UserStatusBadge.tsx
├── hooks/
│   ├── useUsers.ts
│   └── useUserActions.ts
├── model/
│   ├── user.types.ts
│   ├── user.constants.ts
│   └── user.mappers.ts
├── pages/
│   └── UsersPage.tsx
└── index.ts
```

**No se crean todos esos archivos si el código no los necesita.** La estructura es patrón, no obligación rígida.

`UsersPage` deja de concentrar toda la lógica:

```text
UsersPage
├── UserFilters
├── UsersTable
├── EditUserDialog
└── ChangeRoleDialog
```

El acceso a datos queda en `api`/hooks según el stack real.

## Feature `roles`

Intencionalmente pequeño si no existe UI propia:

```text
features/roles/
├── api/
│   └── roles.api.ts
├── model/
│   └── role.types.ts
└── index.ts
```

No crear `components/`, `hooks/`, `pages/` sin necesidad. El feature demuestra la filosofía: capas internas pequeñas, no plantillas rígidas.

## Autorización frontend

Se documenta explícitamente:

```text
Frontend authorization = UX restriction
Backend authorization  = security enforcement
```

Nunca se confía en ocultar botones o rutas como seguridad real. Se preservan los guards y políticas del backend.

## Tests

Los tests se mueven junto al feature. Se elige una estrategia:

```text
features/users/pages/UsersPage.test.tsx
```

o:

```text
features/users/__tests__/
```

No se mezclan ambas sin motivo. Se preservan los tests actuales de Login, Profile, Users y flujos críticos existentes.

## Criterios de revisión

Antes de declarar un slice terminado:

```text
¿shared conoce features?
¿feature importa internals de otro feature?
¿página concentra API + estado + UI?
¿API del feature encapsulada?
¿index.ts expone public API pequeña?
¿carpetas innecesarias creadas?
```