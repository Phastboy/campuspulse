# modules/

Thin NestJS wiring modules. These files contain no business logic, no direct method calls, and no algorithmic code. Their only job is to declare which providers exist, which injection tokens they satisfy, and which tokens are exported for other modules to consume.

```
modules/
├── app.module.ts        Root module — global config, ORM, feature module imports
├── events.module.ts     Wires event persistence ports to MikroOrmEventRepository
└── ingestion.module.ts  Wires ingestion pipeline and assembles SIMILARITY_RULES
```

---

## Why keep separate modules

A single `AppModule` is simpler today but becomes a registration dump as the codebase grows. NestJS modules are not just organisational sugar — they are the encapsulation unit. They control what is exported and what stays private. `IngestionModule` receives `EVENT_CREATOR`, `CANDIDATE_REPOSITORY`, and `TRANSACTION_MANAGER` only because `EventsModule` explicitly exports those tokens. Nothing else leaks.

When Phase 2 adds an `AuthModule`, it becomes one new file here and the relevant classes in the flat source directories — no reshuffling of existing modules.

---

## events.module.ts

Registers `MikroOrmEventRepository` under four segregated tokens and exports all five event-domain tokens:

| Token | Interface | Consumer |
|-------|-----------|---------|
| `EVENT_READER` | `IEventReader` | `EventsService` |
| `EVENT_MUTATOR` | `IEventMutator` | `EventsService` |
| `EVENT_CREATOR` | `IEventCreator` | `IngestionService` |
| `CANDIDATE_REPOSITORY` | `ICandidateRepository` | `SimilarityEngine` |
| `TRANSACTION_MANAGER` | `ITransactionManager` | `IngestionService` |

---

## ingestion.module.ts

Imports `EventsModule` to receive the five exported tokens above. Registers the ingestion pipeline providers and assembles the `SIMILARITY_RULES` array via a factory so `SimilarityEngine` receives all rules through injection rather than instantiating them directly.

---

## app.module.ts

Registers `ConfigModule` (global, with Zod validation) and `MikroOrmModule` (root connection), then imports `IngestionModule`. `EventsModule` is not imported directly here because `IngestionModule` already imports it — NestJS deduplicates shared modules automatically.
