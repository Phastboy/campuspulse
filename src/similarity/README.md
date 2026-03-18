# similarity/

The duplicate-detection subsystem. Sits in the application layer — no ORM imports, no HTTP imports, no framework decorators except `@Injectable` and `@Inject`.

```
similarity/
├── similarity-rule.interface.ts   SimilarityRule and SimilarityContext contracts
├── rule-evaluator.ts              Runs rules concurrently, aggregates weighted scores
└── similarity-engine.service.ts   Orchestrates candidate search and scoring
```

---

## similarity-rule.interface.ts

`SimilarityContext` — the complete input to every rule: the incoming `EventSubmission`, the candidate `EventSummary`, and a pre-extracted `submissionDate`. Typed as `EventSummary` (not the ORM entity) so rules have zero MikroORM dependency.

`SimilarityRule` — the contract each scoring rule must satisfy. The special name `"exact"` enables the short-circuit path in `SimilarityEngine`.

---

## rule-evaluator.ts

Runs all non-exact rules concurrently via `Promise.allSettled`. A failing rule is logged and excluded from the weighted average without affecting others. Returns `SimilarityMatch` — a plain application type, no Swagger decorators.

---

## similarity-engine.service.ts

Implements `ISimilarityEngine`. Builds a ±7-day candidate window, short-circuits on exact matches, scores the rest via `RuleEvaluator`, filters below the 0.3 threshold, and sorts descending. Returns `SimilarityMatch[]` — the controller maps these to `ScoredEvent` DTOs at the boundary.
