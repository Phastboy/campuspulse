# application/

Application-layer coordination types. These are the shapes that flow between use cases — they are not domain knowledge, and they are not HTTP shapes. They import only from `@domain`.

```
application/
└── types/
    ├── event-query.ts        Filter parameters for IEventReader.findAll
    ├── event-submission.ts   Normalised submission flowing through ingestion
    ├── event-summary.ts      Minimal projection for similarity scoring and responses
    ├── paginated-events.ts   Return type of IEventReader.findAll
    ├── similarity-match.ts   Per-candidate scoring result from SimilarityEngine
    └── ingestion-outcome.ts  Discriminated union of all pipeline outcomes
```

---

## Why a separate application layer?

In a previous iteration these types lived in `domain/types/`. That was wrong — the domain should model *what things are* (an Event, a User, a datetime), not *how use cases coordinate* (a submission flowing through a pipeline, an outcome from an ingestion decision). Moving them here makes the distinction explicit.

`domain/` can now compile with zero npm dependencies and zero src imports. These application types depend on domain interfaces — that dependency flows inward, which is correct.

---

## Key types

**`EventSubmission`** — `Omit<IEvent, 'id' | 'createdAt'>`. The normalised form of a submission after the mapper has hydrated raw ISO strings into `Date` objects. Produced by `EventDateTimeMapper`, consumed by `SimilarityEngine` and `IEventCreator`.

**`EventSummary`** — `Omit<IEvent, 'description' | 'createdAt'>`. The minimal projection returned to ingestion consumers. The adapter projects `Event → EventSummary` internally so the ingestion layer never receives an ORM entity.

**`SimilarityMatch`** — the domain-level result of scoring one candidate. No Swagger decorators. Mapped to `ScoredEvent` (the HTTP DTO) at the controller boundary.

**`IngestionOutcome`** — `CreatedOutcome | LinkedOutcome | NeedsDecisionOutcome`. The domain-level return type of `IngestionService`. Mapped to `IngestionResult` (the HTTP DTO union) at the controller boundary.
