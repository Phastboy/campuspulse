# src/

Application source code. The architecture follows Hexagonal (Ports & Adapters) principles layered over Clean Architecture.

```
src/
├── domain/          Pure domain — interfaces, value objects, errors. Zero npm dependencies.
├── application/     Application layer coordination types. Imports only from domain.
├── ports/           Port interfaces and injection tokens. Imports from domain and application.
├── infrastructure/  ORM entities and adapters. The only layer that imports MikroORM.
├── services/        Application services. Orchestrate use cases via ports.
├── controllers/     HTTP boundary. Maps DTOs ↔ application types. No business logic.
├── similarity/      Similarity engine, rule evaluator, and rule interface.
├── rules/           Concrete similarity scoring rule implementations.
├── mappers/         Conversion between DTOs and application/domain types.
├── helpers/         Shared utility functions.
├── dto/             HTTP input/output shapes with validation decorators.
├── configs/         All configuration — env validation, MikroORM, Swagger.
├── modules/         Thin NestJS wiring modules. No logic — providers and exports only.
├── common/          Global exception filter. Nothing else.
├── app.controller.ts
├── app.service.ts
└── main.ts
```

---

## Dependency rules

```
domain        ← no imports from src/ at all
application   ← domain only
ports         ← domain, application
services      ← ports, application, domain, mappers, dto (input shapes only)
similarity    ← application, ports
rules         ← similarity (for interface), helpers
mappers       ← domain, application, dto
controllers   ← services, dto, domain, application
infrastructure ← domain, application, ports (MikroORM imports permitted here only)
configs       ← external libs only (zod, nestjs/config, mikro-orm, swagger)
modules       ← everything (wiring only)
common        ← nothing from src/
```

The critical invariant: **`domain/` and `ports/` compile to zero with no npm packages installed** — they contain only TypeScript interfaces and plain types.

---

## Adapters

Infrastructure adapters live in `infrastructure/adapters/`. Each adapter implements exactly one port interface. No class implements two ports. This is a strict rule — if you find yourself writing `implements IFoo, IBar`, split it into two adapters.

---

## Path aliases

| Alias | Resolves to |
|-------|------------|
| `@domain` | `src/domain` |
| `@application` | `src/application` |
| `@ports` | `src/ports` |
| `@services` | `src/services` |
| `@controllers` | `src/controllers` |
| `@infrastructure` | `src/infrastructure` |
| `@similarity` | `src/similarity` |
| `@rules` | `src/rules` |
| `@mappers` | `src/mappers` |
| `@helpers` | `src/helpers` |
| `@dto` | `src/dto` |
| `@configs` | `src/configs` |
| `@modules` | `src/modules` |
| `@common` | `src/common` |

---

## Per-directory documentation

- [`domain/README.md`](domain/README.md)
- [`application/README.md`](application/README.md)
- [`ports/README.md`](ports/README.md)
- [`infrastructure/README.md`](infrastructure/README.md)
- [`similarity/README.md`](similarity/README.md)
- [`rules/README.md`](rules/README.md)
- [`modules/README.md`](modules/README.md)
- [`configs/README.md`](configs/README.md)
- [`common/README.md`](common/README.md)
