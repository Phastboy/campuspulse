# events/

Everything related to published campus events: reading, updating, deleting, and the persistence layer that backs them.

```
events/
├── domain/        Domain types and errors — no framework dependencies
├── dto/           HTTP input/output shapes for the events endpoints
├── entities/      MikroORM entity definition
├── mappers/       Domain assembler for applying partial datetime updates
├── ports/         Read and write port interfaces + injection tokens
├── repositories/  MikroORM implementations of all four port interfaces
├── events.controller.ts   HTTP boundary — maps DTOs to domain types, delegates to service
├── events.service.ts      Application logic — find, update, remove
└── events.module.ts       NestJS module — wires ports to implementations, exports tokens
```

---

## domain/

Pure TypeScript — no NestJS, no MikroORM, no HTTP concepts.

**`event-query.ts`** — `EventQuery`, the domain-level equivalent of `EventQueryDto`. `IEventReader.findAll` accepts this type, not the HTTP DTO. The controller maps `EventQueryDto → EventQuery` at the boundary before calling the service. This keeps the port interface stable even if the HTTP input shape changes.

**`event-submission.ts`** — `EventSubmission`, the normalised domain object that flows through the ingestion pipeline. Produced by `EventDateTimeMapper` from a `SubmitEventDto`; consumed by `SimilarityEngine` and `IEventCreator`. It carries hydrated `Date` objects, not raw ISO strings.

**`event-summary.ts`** — `EventSummary`, a minimal read-only projection of an `Event` entity. Used by the similarity engine and returned in `ScoredEvent` responses. Excludes `createdAt` and all ORM-specific fields — the ingestion module receives this type, not the full entity, so it has no dependency on MikroORM.

**`invalid-datetime.error.ts`** — `InvalidDatetimeError`, a plain `Error` subclass thrown by `EventDateTimeAssembler` when a datetime update is structurally invalid (e.g. switching to `specific` type without providing a `startTime`). It is a domain error — no `BadRequestException`, no NestJS import. `EventsService` catches it and translates to `BadRequestException` at the HTTP boundary.

**`paginated-events.ts`** — `PaginatedEvents`, the return type of `IEventReader.findAll`. Lives in `domain/` because it is a shared contract between the port interface, the repository, and the service. Defining it inside any one of those would create an upward import.

---

## dto/

HTTP-layer shapes for the events endpoints.

**`event-query.dto.ts`** — `EventQueryDto`, the query string shape for `GET /api/events`. The controller maps this to `EventQuery` before passing it to the service — the service never sees an HTTP DTO.

**`update-event.dto.ts`** — `UpdateEventDto`, the body shape for `PATCH /api/events/:id`. Extends `EventFieldsDto` from `@common/dto` rather than `SubmitEventDto` from `ingestion/` — a deliberate break of a cross-module DTO dependency that previously existed.

**`create-event.dto.ts`** — `CreateEventDto`, a minimal shape for the Phase 1 curator workflow. Most event creation flows through the ingestion pipeline instead.

---

## entities/

**`event.entity.ts`** — the MikroORM entity for the `events` table. The `datetime` field is stored as `jsonb` to accommodate the `EventDateTime` discriminated union without separate columns. MikroORM does not hydrate nested `Date` objects inside JSONB — `datetime.date` and `datetime.startTime` arrive as ISO strings at runtime. Use `getComparableDateFromSummary` from the ingestion helpers when a reliable `Date` is needed.

---

## mappers/

**`event-datetime.assembler.ts`** — `EventDateTimeAssembler`, the only class allowed to merge a partial update onto an existing `EventDateTime`. It is pure domain logic: no HTTP imports, no ORM imports. It throws `InvalidDatetimeError` on invalid input; `EventsService` catches that and translates to `BadRequestException`.

There is also an `event-datetime.mapper.ts` in this directory. It maps `SubmitEventDto` to `EventSubmission` — but that file belongs to the ingestion concern and is a carry-over that should be considered for removal. The canonical version lives in `ingestion/mappers/`.

---

## ports/

Three segregated interfaces following the Interface Segregation Principle. Each consumer receives only the interface it needs:

**`event-reader.port.ts`** — `IEventReader` (`EVENT_READER` token). Read-only queries: `findAll`, `findById`, `findByVenue`. Consumed by `EventsService`.

**`event-creator.port.ts`** — `IEventCreator` (`EVENT_CREATOR` token). Single method: `create(submission)`. Consumed exclusively by `IngestionService` — the only caller that creates events. Keeping this separate from the mutator means ingestion cannot call `save` or `remove` accidentally.

**`event-mutator.port.ts`** — `IEventMutator` (`EVENT_MUTATOR` token). `save` and `remove` on existing entities. Consumed exclusively by `EventsService`. Ingestion cannot see these methods.

There is also `event-writer.port.ts` which combines create/save/remove. This is a broader combined interface — `EVENT_CREATOR` and `EVENT_MUTATOR` are the preferred tokens for new code since they carry only the methods each consumer actually needs.

---

## repositories/

**`mikro-orm-event.repository.ts`** — `MikroOrmEventRepository`, the only class in the codebase that imports MikroORM. It implements `IEventReader`, `IEventCreator`, `IEventMutator`, and `ICandidateRepository` — all four registered under separate injection tokens. The `findCandidatesInWindow` method projects `Event → EventSummary` before returning, so the ingestion module never receives a raw ORM entity.

**`mikro-orm-transaction-manager.ts`** — `MikroOrmTransactionManager`, the concrete implementation of `ITransactionManager` from `common/ports/`. Wraps `EntityManager.transactional()` behind the ORM-agnostic interface.

Swapping MikroORM for another ORM means rewriting these two files and nothing else — no service, port, or domain type needs to change.

---

## events.module.ts

Wires `MikroOrmEventRepository` under all four tokens and exports them so `IngestionModule` can inject them without importing the concrete class:

| Token | Interface | Consumed by |
|-------|-----------|-------------|
| `EVENT_READER` | `IEventReader` | `EventsService` |
| `EVENT_MUTATOR` | `IEventMutator` | `EventsService` |
| `EVENT_CREATOR` | `IEventCreator` | `IngestionService` |
| `CANDIDATE_REPOSITORY` | `ICandidateRepository` | `SimilarityEngine` |
| `TRANSACTION_MANAGER` | `ITransactionManager` | `IngestionService` |
