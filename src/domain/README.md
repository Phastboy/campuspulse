# domain/

The innermost layer. Zero dependencies on any framework, ORM, or HTTP library. Everything here is plain TypeScript.

```
domain/
├── interfaces/   Entity contracts that infrastructure must implement
├── types/        Shared domain objects flowing through the application
└── errors/       Domain errors with no HTTP coupling
```

---

## interfaces/

**`event.interface.ts`** — `IEvent`, the domain contract for a campus event. The ORM entity (`Event` in `infrastructure/entities/`) implements this interface. This is the architectural inversion: the domain dictates the shape; infrastructure conforms to it. If the entity ever diverges from what domain logic expects, TypeScript catches it at compile time.

Port interfaces (`IEventReader`, `IEventCreator`, etc.) use `IEvent` as their return type rather than the concrete `Event` class. This means services and the application layer never depend on ORM internals — they work with the domain contract only.

---

## types/

Plain TypeScript interfaces representing domain concepts. No decorators, no framework imports.

**`event-query.ts`** — `EventQuery`, the domain-level filter parameters for `IEventReader.findAll`. The controller maps `EventQueryDto → EventQuery` at the HTTP boundary so the port interface stays stable even if the HTTP input shape changes.

**`event-submission.ts`** — `EventSubmission`, the normalised domain object that flows through the ingestion pipeline. Produced by `EventDateTimeMapper` from a `SubmitEventDto`; all date fields are hydrated `Date` objects at this point.

**`event-summary.ts`** — `EventSummary`, a minimal read-only projection containing only `id`, `title`, `datetime`, and `venue`. Used by the similarity engine and returned in scored-event responses. The ingestion pipeline receives this type — never the full ORM entity — so it has zero dependency on MikroORM.

**`paginated-events.ts`** — `PaginatedEvents`, the return type of `IEventReader.findAll`. Defined here rather than inside any single service or repository so it is a shared stable contract.

---

## errors/

**`invalid-datetime.error.ts`** — `InvalidDatetimeError`, a plain `Error` subclass thrown by `EventDateTimeAssembler` when a datetime update is structurally invalid. No `BadRequestException`, no NestJS import. `EventsService` catches it and translates to `BadRequestException` at the HTTP boundary, where HTTP concerns belong.

---

## Rules for this directory

- No imports from `@nestjs/*`, `@mikro-orm/*`, or any npm package except `@common`
- No imports from any other `src/` directory except `@common`
- No decorators except plain TypeScript ones
