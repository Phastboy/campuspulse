# infrastructure/

The only layer permitted to import MikroORM. Adapts external technology (ORM, database driver) to the contracts defined in `ports/` and `domain/`.

```
infrastructure/
├── entities/
│   └── event.entity.ts                           Implements IEvent
└── adapters/
    ├── mikro-orm-event-reader.adapter.ts          Implements IEventReader
    ├── mikro-orm-event-creator.adapter.ts         Implements IEventCreator
    ├── mikro-orm-event-repository.adapter.ts      Implements IEventRepository
    ├── mikro-orm-candidate-repository.adapter.ts  Implements ICandidateRepository
    └── mikro-orm-transaction-manager.adapter.ts   Implements ITransactionManager
```

---

## entities/

**`event.entity.ts`** — the MikroORM `@Entity` class for the `events` table. Explicitly `implements IEvent` — if the entity ever diverges from what the domain expects, TypeScript fails the build at compile time. Infrastructure conforms to domain, never the reverse.

The `datetime` field is stored as `jsonb`. MikroORM does not hydrate nested `Date` objects inside JSONB — `datetime.date` and `datetime.startTime` may arrive as ISO strings at runtime. Use `getComparableDateFromSummary` from `@helpers` when a reliable `Date` is needed.

---

## adapters/

One adapter per port. No adapter implements more than one port interface — this is a strict rule. If an adapter needed to implement two ports, that would indicate the ports are not properly segregated or that shared infrastructure state (an `EntityManager`) is being conflated with the interface contract.

Each adapter is a thin delegation class. The shared `EntityManager` is injected by NestJS's DI container, so multiple adapters can use the same ORM session within a request without coupling to each other.

**`MikroOrmEventReaderAdapter`** — read queries: `findAll` (paginated, filtered), `findById`, `findByVenue`.

**`MikroOrmEventCreatorAdapter`** — `create`: persists a new event from an `EventSubmission`.

**`MikroOrmEventRepositoryAdapter`** — `update(id, changes)` applies an explicit `EventChanges` object via `assign` + `flush`. `delete(id)` locates the record itself and removes it. No Unit of Work, no entity references from the caller.

**`MikroOrmCandidateRepositoryAdapter`** — `findCandidatesInWindow`: fetches events within a date range and projects `Event → EventSummary` internally, so the ingestion layer never receives an ORM entity.

**`MikroOrmTransactionManagerAdapter`** — wraps `EntityManager.transactional()` behind the `ITransactionManager` interface.

---

## Rules for this directory

- MikroORM imports are permitted here and **only** here
- Must not import from `@services`, `@controllers`, `@dto`, or `@similarity`
- Each adapter class implements exactly one port interface
