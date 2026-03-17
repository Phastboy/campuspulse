# infrastructure/

The only layer allowed to import MikroORM. Everything here adapts external technology (the ORM, the database driver) to the domain contracts defined in `ports/` and `domain/`.

```
infrastructure/
├── entities/
│   └── event.entity.ts                   MikroORM entity — implements IEvent
└── repositories/
    ├── mikro-orm-event.repository.ts      Implements IEventReader, IEventCreator, IEventMutator, ICandidateRepository
    └── mikro-orm-transaction-manager.ts   Implements ITransactionManager
```

---

## entities/

**`event.entity.ts`** — the MikroORM `@Entity` class for the `events` table. It explicitly `implements IEvent` from `@domain/interfaces`. This is the architectural inversion enforced at the type level: the domain defines the contract; the entity must satisfy it. If a field is added to `IEvent` but not to the entity, or if a type changes incompatibly, TypeScript fails the build.

The `datetime` field is stored as `jsonb` to hold the `EventDateTime` discriminated union without separate columns. MikroORM does not hydrate nested `Date` objects inside JSONB — `datetime.date` and `datetime.startTime` arrive as ISO strings at runtime. Use `getComparableDateFromSummary` from `@helpers` when a reliable `Date` is needed.

---

## repositories/

**`mikro-orm-event.repository.ts`** — `MikroOrmEventRepository`, the sole MikroORM class for event persistence. Implements all four event-related port interfaces and is registered under four injection tokens in `EventsModule`. The `findCandidatesInWindow` method projects `Event → EventSummary` internally — the ingestion layer never receives a raw ORM entity.

**`mikro-orm-transaction-manager.ts`** — `MikroOrmTransactionManager`, wraps `EntityManager.transactional()` behind the `ITransactionManager` interface. Callers express "run this atomically" without importing anything from MikroORM.

---

## Rules for this directory

- May import from `@domain`, `@ports`, and `@common`
- Must never import from `@services`, `@controllers`, or `@dto`
- MikroORM imports are permitted here and **only** here — no other directory may import from `@mikro-orm/*`
