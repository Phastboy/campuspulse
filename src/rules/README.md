# rules/

Concrete similarity scoring rules. Each implements `SimilarityRule` from `@similarity/similarity-rule.interface`.

```
rules/
├── base/
│   └── text-similarity.rule.ts   Abstract base — Template Method pattern for string fields
├── exact-match.rule.ts           title + venue + date = 1.0 → short-circuit in engine
├── title-similarity.rule.ts      Jaccard + substring on titles (weight 0.5)
├── venue-similarity.rule.ts      Jaccard + substring on venues (weight 0.3)
└── date-proximity.rule.ts        Linear decay over 7-day window (weight 0.2)
```

**Adding a new rule:** implement `SimilarityRule`, mark `@Injectable()`, add to `IngestionModule` providers and the `SIMILARITY_RULES` factory. No changes to `SimilarityEngine` or `RuleEvaluator` — Open/Closed principle.
