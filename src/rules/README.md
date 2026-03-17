# rules/

Concrete similarity scoring rules. Each rule implements `SimilarityRule` from `@similarity/similarity-rule.interface`.

```
rules/
├── base/
│   └── text-similarity.rule.ts   Abstract base for string-field rules
├── exact-match.rule.ts           Short-circuit rule — title + venue + date → 1.0
├── title-similarity.rule.ts      Jaccard + substring on event titles (weight 0.5)
├── venue-similarity.rule.ts      Jaccard + substring on venues (weight 0.3)
└── date-proximity.rule.ts        Linear decay over 7-day window (weight 0.2)
```

---

## base/text-similarity.rule.ts

`TextSimilarityRule` — abstract base using the Template Method pattern. Defines the full scoring algorithm once (normalise → exact match → substring containment → Jaccard word overlap). Subclasses provide only two things: `extractField` (which string to pull from the context) and `noisePattern` (characters to strip during normalisation). Eliminates the duplicated normalisation and Jaccard logic that would otherwise live in both the title and venue rules.

---

## exact-match.rule.ts

`ExactMatchRule` — returns 1.0 when title, venue, and calendar date all match exactly after normalisation; 0 otherwise. The special name `"exact"` causes `SimilarityEngine` to short-circuit immediately on a 1.0 score — no other rules are evaluated for that candidate.

---

## title-similarity.rule.ts

`TitleSimilarityRule` — weight 0.5, the strongest duplicate signal. Extends `TextSimilarityRule`.

---

## venue-similarity.rule.ts

`VenueSimilarityRule` — weight 0.3. Extends `TextSimilarityRule`. Overrides `substringScore` to return a fixed 0.9 — partial venue name matches (e.g. "ACE" matching "ACE Conference Hall, ICT") are highly reliable and should score uniformly high rather than varying by length ratio.

---

## date-proximity.rule.ts

`DateProximityRule` — weight 0.2. Scores 1.0 for the same calendar day, decaying linearly to 0 at 7 days apart. Has an `isApplicable` guard — if the submission date cannot be parsed, the rule is skipped rather than throwing, so a single bad record never breaks the scoring run.

---

## Adding a new rule

1. Create a class implementing `SimilarityRule` (or extending `TextSimilarityRule` for string fields), mark it `@Injectable()`
2. Add it to `IngestionModule` providers
3. Inject it into the `SIMILARITY_RULES` factory in `IngestionModule`

No changes to `SimilarityEngine` or `RuleEvaluator` are required — Open/Closed principle.
