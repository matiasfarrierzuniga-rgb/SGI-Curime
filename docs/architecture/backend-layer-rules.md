# Reglas de capas del backend

## Propósito

Definir la arquitectura objetivo de capas para el backend SGI-Curime. `Users`, `Roles` y `Auth` son los módulos de referencia que la implementan.

Esta regla no justifica reescritura masiva. Cada módulo se migra incrementalmente respetando las reglas no negociables del [sprint-1-scope.md](./sprint-1-scope.md).

## Capas

Cada módulo del backend vive en `backend/src/modules/<modulo>/` y puede contener estas capas:

```text
modules/<modulo>/
├── domain/
├── application/
├── infrastructure/
├── presentation/
└── <modulo>.module.ts
```

**Regla: no crear carpetas vacías ni capas sin responsabilidad real.** Una capa existe cuando hay código que la justifica.

## Dependencias permitidas

```text
Presentation  → Application, Domain
Application   → Domain
Domain        → (nada)
Infrastructure → Application, Domain
```

La dependencia fluye hacia el dominio. El dominio es el centro, no depende de nada externo.

## Prohibiciones

```text
Domain        ─X─► Prisma
Domain        ─X─► NestJS
Domain        ─X─► HTTP
Application   ─X─► Presentation
Application   ─X─► Prisma (acceso directo)
Presentation  ─X─► Prisma
Infrastructure ─X─► Presentation
```

Interpretación:

- **Domain**: conceptos de negocio puros. No importa tipos Prisma, NestJS ni HTTP.
- **Application**: orquesta casos de uso. No conoce controllers, no accede directamente a Prisma.
- **Infrastructure**: detalles tecnológicos (Prisma, bcrypt, JWT). Conecta la aplicación con el mundo exterior.
- **Presentation**: adapta HTTP/NestJS hacia Application. No contiene reglas de negocio.

## Domain

Contiene conceptos de negocio que realmente existen:

```text
domain/
├── entities/
├── errors/
├── policies/
└── repositories/
```

Ejemplos para `users`:

```text
User
UserStatus
UserRole
AccountLockState
UserNotFoundError
LastAdministratorError
AdministratorContinuityPolicy
UserRepository (contrato)
```

Reglas:

- El dominio no importa tipos Prisma, NestJS ni HTTP.
- No es obligatorio crear entidades ricas si el dominio no lo necesita. Una interfaz simple válida que exprese el modelo es suficiente.
- No se lanzan excepciones Nest desde el dominio ni desde application.

## Application

Contiene los casos de uso y los puertos que necesita:

```text
application/
├── use-cases/
├── dto/
└── ports/
```

Reglas:

- Orquesta: valida, llama al repositorio, aplica políticas, devuelve resultado.
- No accede directamente a Prisma.
- No importa `bcrypt`, `JwtService` ni cualquier dependencia concreta de infraestructura. Usa puertos definidos en `application/ports/`.
- No lanza `BadRequestException`, `ConflictException`, `NotFoundException`. Lanza errores de dominio/aplicación; Presentation los traduce a códigos HTTP.

## Infrastructure

Implementa los puertos:

```text
infrastructure/
├── persistence/
│   ├── prisma-user.repository.ts
│   └── user.persistence-mapper.ts
├── security/
│   ├── bcrypt-password-hasher.ts
│   └── jwt-token-service.ts
└── ...
```

Aquí sí son válidos `Prisma`, `PrismaService`, `Prisma.UserWhereInput`, `Prisma.TransactionClient`, `bcrypt`, `JwtService`.

Reglas:

- Prisma vive solo aquí, detrás de repositorios.
- El acceso concreto a BD (filtros, paginación, transacciones, aislamiento, constraints) se mueve detrás del repositorio.
- La infraestructura no contiene lógica de negocio.

## Presentation

Adapta HTTP/NestJS hacia Application:

```text
presentation/
├── controllers/
├── dto/
├── guards/
└── decorators/
```

Reglas:

- El controller es delgado: valida DTO, llama al caso de uso, traduce errores a respuestas HTTP.
- No contiene reglas de negocio, Prisma, transacciones, auditoría directa ni cálculos de dominio.
- Guards y decorators (`JwtAuthGuard`, `RolesGuard`, `@Roles()`) pertenecen a Presentation por depender de NestJS/HTTP. No van a Domain.
- La traducción de errores de dominio a códigos HTTP ocurre aquí:

```text
UserNotFoundError       → 404
EmailAlreadyRegistered  → 409
LastAdministratorError  → 409
...
```

Preserva el comportamiento observable exacto actual.

## Repositorios

El contrato expresa las necesidades reales de la aplicación:

```text
domain/repositories/user.repository.ts
```

Ejemplo de operaciones legítimas:

```text
findById
findByEmail
findMany
count
update
changeRole
countActiveAdministrators
unlock
```

Prohibido crear una abstracción genérica:

```typescript
find(query: any)
update(data: any)
```

Eso filtra conceptos Prisma hacia Domain/Application.

## Políticas

Las reglas de negocio críticas se modelan explícitamente como políticas testeables sin Nest ni Prisma:

```text
domain/policies/
└── administrator-continuity.policy.ts
```

La regla *"el último administrador activo no puede perder el rol administrativo"* debe dejar de ser lógica oculta en un service genérico.

## Transacciones

No se debilita la atomicidad. Para reglas como la del último administrador se conservan las garantías actuales (`SERIALIZABLE` si ya existen).

Si un caso de uso necesita coordinar múltiples operaciones atómicas, se introduce un mecanismo mínimo de transaction boundaries. No se diseña un Unit of Work global innecesariamente.

## Auditoría

Los casos de uso no dependen directamente del `AuditService` concreto. Cuando esté justificado se introduce un puerto:

```text
application/ports/audit.port.ts
```

```typescript
interface AuditPort {
  record(event: AuditEvent): Promise<void>;
}
```

Un adaptador delega al mecanismo actual de auditoría. No se reescribe el sistema de auditoría; solo se desacopla Application.

## Puertos y abstracciones: cuándo crearlos

Antes de crear una interfaz, responder:

```text
¿qué dependencia concreta desacoplamos?
¿qué necesidad de test o arquitectura resuelve?
¿hay al menos un consumidor real?
```

Razonables cuando el código real los necesita:

```text
UserRepository
RoleRepository
PasswordHasher
TokenService
AuditPort
MailPort
```

Evitar sin necesidad demostrada:

```text
GenericRepository<T>
BaseUseCase
AbstractDomainService
UniversalMapper
GlobalUnitOfWork
```

## Ceremonia mínima: ejemplo Roles

No todos los módulos necesitan la misma cantidad de capas. `Roles` es intencionalmente pequeño:

```text
modules/roles/
├── domain/
│   └── role.ts
├── application/
│   ├── ports/
│   └── use-cases/
├── infrastructure/
│   └── prisma-role.repository.ts
├── presentation/
│   └── roles.controller.ts
└── roles.module.ts
```

Las capas se crean solo cuando hay responsabilidades que las justifican.

## Criterios de revisión

Antes de declarar un módulo terminado:

```text
¿Domain importa Prisma?
¿Domain importa NestJS?
¿Application importa Prisma?
¿Controller contiene reglas?
¿Infrastructure contiene negocio?
¿Errores HTTP separados del negocio?
¿Repositorios expresan necesidades reales?
¿Puertos tienen consumidor real?
```