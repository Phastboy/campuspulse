# ports/

All port interfaces and their injection tokens. Ports are the seams between the application layer and infrastructure — they express *what* is needed without specifying *how* it is provided.

Every port uses only domain types in its signatures. No ORM entities, no DTOs, no framework types cross a port boundary.

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

## Port map

| Port | Token | Implementation | Registered in | Consumed by |
|------|-------|---------------|---------------|-------------|
| `IEventReader` | `EVENT_READER` | `MikroOrmEventRepository` | `EventsModule` | `EventsService` |
| `IEventCreator` | `EVENT_CREATOR` | `MikroOrmEventRepository` | `EventsModule` | `IngestionService` |
| `IEventMutator` | `EVENT_MUTATOR` | `MikroOrmEventRepository` | `EventsModule` | `EventsService` |
| `ICandidateRepository` | `CANDIDATE_REPOSITORY` | `MikroOrmEventRepository` | `EventsModule` | `SimilarityEngine` |
| `ISimilarityEngine` | `SIMILARITY_ENGINE` | `SimilarityEngine` | `IngestionModule` | `IngestionService` |
| `ITransactionManager` | `TRANSACTION_MANAGER` | `MikroOrmTransactionManager` | `EventsModule` | `IngestionService` |

---

## Why segregated ports

`MikroOrmEventRepository` implements four interfaces but is registered under four separate tokens. Each consumer injects only the token for the interface it needs:

- `IngestionService` injects `EVENT_CREATOR` — it can only call `create`. It cannot call `save`, `remove`, `findAll`, or any read method.
- `EventsService` injects `EVENT_READER` and `EVENT_MUTATOR` — it can query and mutate, but not create (creation belongs to the ingestion pipeline).
- `SimilarityEngine` injects `CANDIDATE_REPOSITORY` — it receives only `findCandidatesInWindow`, nothing else.

This is Interface Segregation in practice: callers depend only on the methods they actually use.

---

## Swapping the implementation

Replacing MikroORM with another ORM means writing a new class that implements the relevant interfaces and updating the `useExisting` references in `EventsModule`. No service, no domain type, and no port interface changes.
