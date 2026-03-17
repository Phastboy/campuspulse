# similarity/

The duplicate-detection subsystem. Sits in the application layer — no ORM imports, no HTTP imports.

```
similarity/
├── similarity-rule.interface.ts   SimilarityRule and SimilarityContext contracts
├── rule-evaluator.ts              Runs rules concurrently, aggregates weighted scores
└── similarity-engine.service.ts   Orchestrates candidate search and scoring
```

---

## similarity-rule.interface.ts

Defines two contracts consumed by everything else in this directory and by `@rules`:

**`SimilarityContext`** — the complete input to every rule: the incoming `EventSubmission`, the candidate `EventSummary`, and a pre-extracted `submissionDate`. Rules read only from context; they never reach outside it. `candidate` is typed as `EventSummary` (not the ORM entity) so rules have zero MikroORM dependency.

**`SimilarityRule`** — the contract each scoring rule must satisfy: `name`, `weight`, `calculate(context): number`, and the optional `isApplicable(context): boolean` guard. The special name `"exact"` enables the short-circuit path in `SimilarityEngine`.

---

## rule-evaluator.ts

`RuleEvaluator` runs all non-exact rules concurrently via `Promise.allSettled`. A failing rule is logged and excluded from the weighted average without affecting others. Per-rule diagnostic scores are logged here and never surfaced above — they do not appear in any port contract or HTTP response. Returns a fully formed `ScoredEvent`.

Instantiated inside `SimilarityEngine`'s constructor rather than registered as a NestJS provider — it is an internal implementation detail of the engine, not a boundary that needs to be substitutable.

---

## similarity-engine.service.ts

`SimilarityEngine` implements `ISimilarityEngine` and orchestrates the full flow:

1. Build a ±7-day candidate window around the submission date
2. Fetch candidates via `ICandidateRepository`
3. Short-circuit on exact matches (score 1.0 from `ExactMatchRule`)
4. Score remaining candidates concurrently via `RuleEvaluator`
5. Filter below the 0.3 threshold and sort descending

Depends on `ICandidateRepository` and the `SIMILARITY_RULES` token — never on any concrete rule class or repository class directly.
