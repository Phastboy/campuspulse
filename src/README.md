# src/

Application source code. The project follows Clean Architecture with Ports & Adapters — every dependency must flow inward, never outward.

```
src/
├── common/       Shared types, constants, DTOs, and the ITransactionManager port
├── config/       Environment variable validation (Zod schema)
├── database/     MikroORM configuration and migrations
├── events/       Published event management — CRUD, ports, repository, domain types
└── ingestion/    Event submission pipeline — similarity engine, scoring rules, mappers
```

---

## Layer rules

```
HTTP (controllers, DTOs, filters)
         ↓
Application (services, mappers)
         ↓
   Port interfaces
         ↓
Domain (types, errors)
         ↑
Infrastructure (repositories, ORM adapters)
```

| Layer | May import from | Must never import from |
|-------|----------------|------------------------|
| HTTP (controllers) | Application, Domain, `@common` | Infrastructure |
| Application (services) | Domain, Ports, `@common` | Infrastructure directly, HTTP types |
| Domain (types, errors) | `@common` only | Application, Infrastructure, HTTP |
| Infrastructure (repositories) | Domain, Ports | Application, HTTP |

Violations of these rules are not caught by the TypeScript compiler — they must be caught in review. See [`docs/contributing.md`](../docs/contributing.md) for the PR checklist.

---

## Module structure

Each feature module (`events`, `ingestion`) is self-contained. A module owns its controllers, services, DTOs, ports, and repository. Cross-module dependencies flow through exported port tokens — never through direct class imports.

The only cross-module dependency at runtime is `IngestionModule` importing `EventsModule` to receive `EVENT_CREATOR`, `CANDIDATE_REPOSITORY`, and `TRANSACTION_MANAGER` tokens.

---

## Path aliases

TypeScript path aliases are configured in `tsconfig.json`:

| Alias | Resolves to |
|-------|------------|
| `@common` | `src/common` |
| `@events` | `src/events` |

Use these instead of relative `../` paths when crossing module boundaries.

---

## Per-directory documentation

Each subdirectory has its own README covering what it contains and why it is structured the way it is:

- [`common/README.md`](common/README.md)
- [`events/README.md`](events/README.md)
- [`ingestion/README.md`](ingestion/README.md)
