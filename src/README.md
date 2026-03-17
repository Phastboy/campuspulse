# src/

Application source code. The project follows Clean Architecture with Ports & Adapters — every dependency must flow inward, never outward.

```
src/
├── domain/          Interfaces, types, and errors — zero framework dependencies
├── ports/           All port interfaces and injection tokens
├── dto/             All HTTP input/output shapes
├── services/        Application services — orchestration and business logic
├── controllers/     HTTP boundary — maps DTOs to domain types, delegates to services
├── infrastructure/  ORM entity and repository implementations
├── mappers/         DTO ↔ domain object conversion
├── rules/           Similarity scoring rules
├── similarity/      Similarity engine, rule evaluator, and rule interface
├── helpers/         Shared utility functions
├── common/          Constants, datetime types, and exception filter
├── configs/         All configuration — env validation, MikroORM, Swagger
├── modules/         Thin NestJS wiring modules — providers and exports only
├── app.controller.ts
├── app.service.ts
└── main.ts
```

---

## Layer rules

```
HTTP (controllers, DTOs)
        ↓
Application (services, mappers, similarity, rules)
        ↓
    Port interfaces
        ↓
Domain (interfaces, types, errors)
        ↑
Infrastructure (repositories, ORM entity)
```

| Layer | May import from | Must never import from |
|-------|----------------|------------------------|
| HTTP (controllers) | Application, Domain, `@dto`, `@common` | Infrastructure |
| Application (services) | Domain, Ports, `@dto`, `@common` | Infrastructure directly |
| Domain | `@common` only | Anything else |
| Infrastructure | Domain, Ports | Application, HTTP |

Violations are not caught by the TypeScript compiler — they must be caught in review. See [`docs/contributing.md`](../docs/contributing.md).

---

## Path aliases

Every top-level directory has a corresponding alias. Use these instead of relative `../` paths when crossing directories:

| Alias | Resolves to |
|-------|------------|
| `@domain` | `src/domain` |
| `@ports` | `src/ports` |
| `@dto` | `src/dto` |
| `@services` | `src/services` |
| `@controllers` | `src/controllers` |
| `@infrastructure` | `src/infrastructure` |
| `@mappers` | `src/mappers` |
| `@rules` | `src/rules` |
| `@similarity` | `src/similarity` |
| `@helpers` | `src/helpers` |
| `@common` | `src/common` |
| `@configs` | `src/configs` |
| `@modules` | `src/modules` |

---

## Module wiring

NestJS requires `@Module()` classes for provider registration and encapsulation. With the flat source structure, modules live in `src/modules/` and act as pure wiring — no business logic, no direct method calls. Each module's only job is to declare which providers exist, which tokens they satisfy, and which tokens it exports for other modules to consume.

Adding a feature in Phase 2 means adding classes to the flat directories and one new file in `modules/` — no reshuffling of existing code.

---

## Per-directory documentation

- [`domain/README.md`](domain/README.md)
- [`ports/README.md`](ports/README.md)
- [`infrastructure/README.md`](infrastructure/README.md)
- [`similarity/README.md`](similarity/README.md)
- [`rules/README.md`](rules/README.md)
- [`modules/README.md`](modules/README.md)
- [`common/README.md`](common/README.md)
- [`configs/README.md`](configs/README.md)
