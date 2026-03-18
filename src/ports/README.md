# ports/

Port interfaces and their injection tokens. Ports are the seams between the application layer and infrastructure — they express *what* is needed without specifying *how* it is provided.

Ports import only from `@domain` and `@application/types`. No framework types, no ORM types, no HTTP types cross a port boundary. Like `domain/`, ports should compile with no npm packages installed.

```
ports/
├── event-reader.port.ts         IEventReader        EVENT_READER
├── event-creator.port.ts        IEventCreator       EVENT_CREATOR
├── event-mutator.port.ts        IEventMutator       EVENT_MUTATOR
├── candidate-repository.port.ts ICandidateRepository CANDIDATE_REPOSITORY
├── similarity-engine.port.ts    ISimilarityEngine   SIMILARITY_ENGINE
└── transaction-manager.port.ts  ITransactionManager TRANSACTION_MANAGER
```

---

## Port → Adapter map

| Port | Token | Adapter | Module |
|------|-------|---------|--------|
| `IEventReader` | `EVENT_READER` | `MikroOrmEventReaderAdapter` | `EventsModule` |
| `IEventCreator` | `EVENT_CREATOR` | `MikroOrmEventCreatorAdapter` | `EventsModule` |
| `IEventRepository` | `EVENT_REPOSITORY` | `MikroOrmEventRepositoryAdapter` | `EventsModule` |
| `ICandidateRepository` | `CANDIDATE_REPOSITORY` | `MikroOrmCandidateRepositoryAdapter` | `EventsModule` |
| `ITransactionManager` | `TRANSACTION_MANAGER` | `MikroOrmTransactionManagerAdapter` | `EventsModule` |
| `ISimilarityEngine` | `SIMILARITY_ENGINE` | `SimilarityEngine` | `IngestionModule` |

One port. One adapter. Always.

---

## Why segregated ports

Each consumer injects only the token for the interface it needs:

- `IngestionService` injects `EVENT_CREATOR` — it can only call `create`. It cannot call `save`, `remove`, or any read method.
- `EventsService` injects `EVENT_READER` and `EVENT_MUTATOR` — query and mutate, but not create.
- `SimilarityEngine` injects `CANDIDATE_REPOSITORY` — receives only `findCandidatesInWindow`.

This is Interface Segregation enforced at the injection level.

---

## Swapping the implementation

To replace MikroORM with another persistence technology: write new adapter classes implementing the relevant port interfaces, update the `useExisting` references in `EventsModule`. No service, no domain type, no port interface changes.
