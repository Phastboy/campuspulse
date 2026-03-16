# ingestion/

The two-step event submission pipeline. Receives raw HTTP submissions, scores them for duplicates, and either publishes a new event or links to an existing one.

```
ingestion/
├── dto/           HTTP input/output shapes for the ingestion endpoints
├── helpers/       Date utility functions used by rules and the engine
├── interfaces/    SimilarityRule and SimilarityContext contracts
├── mappers/       DTO → domain object conversion
├── ports/         ICandidateRepository and ISimilarityEngine interfaces
├── rules/         Four concrete similarity rules + shared base class
│   └── base/      TextSimilarityRule — abstract base for string-field rules
├── scoring/       RuleEvaluator — runs rules concurrently and aggregates scores
├── ingestion.controller.ts    HTTP boundary — submit and confirm endpoints
├── ingestion.service.ts       Pipeline orchestration — submit, confirm, trust model
├── ingestion.module.ts        NestJS module — wires rules, engine, and imported tokens
└── similarity-engine.service.ts   Candidate search + per-candidate scoring
```

This module contains zero direct ORM imports. All persistence access flows through `ICandidateRepository` and `IEventCreator`, both of which are imported from `EventsModule` via their injection tokens.

---

## dto/

HTTP-layer shapes for the ingestion endpoints.

**`submit-event.dto.ts`** — `SubmitEventDto`, the body shape for `POST /api/ingestion/submit`. Extends `EventFieldsDto` from `@common/dto` — not a local class — so `events/` and `ingestion/` share field definitions without either module importing from the other.

**`confirm-submission.dto.ts`** — `ConfirmSubmissionDto`, the body shape for `POST /api/ingestion/confirm`. Extends `SubmitEventDto` and adds `decision` (`"new"` | `"duplicate"`) and the optional `existingEventId`. The trust model means `decision: "new"` is re-verified against the similarity engine — submitters cannot force duplicates through by claiming their submission is new.

**`ingestion-result.dto.ts`** — `IngestionResult`, the discriminated union of all pipeline outcomes. Narrow on `action` to access shape-specific fields:

| `action` | Shape | Meaning |
|----------|-------|---------|
| `created` | `{ action, eventId, message }` | New event published |
| `linked` | `{ action, eventId, message }` | Linked to existing event |
| `needs_decision` | `{ action, similar, originalSubmission, message }` | Ambiguous — submitter must resolve |

**`similarity.dto.ts`** — `ScoredEvent`, the per-candidate result returned in a `needs_decision` response. Contains the `EventSummary` projection, an aggregate `score`, and a `matches` map showing which individual rules exceeded the 0.7 threshold.

---

## helpers/

**`event-date.helper.ts`** — utilities for working with dates from JSONB fields. MikroORM does not hydrate nested `Date` objects inside JSONB, so `datetime.date` may arrive as a string at runtime. `getComparableDateFromSummary` handles all observed runtime shapes and returns a reliable `Date` or `null`. `isSameDay` compares two dates at calendar-day granularity.

These functions accept `EventSummary` rather than the full `Event` entity — rules are fully decoupled from the ORM entity class.

---

## interfaces/

**`similarity-rule.interface.ts`** — two contracts:

`SimilarityContext` — the input to every rule: the incoming submission, the candidate `EventSummary`, and a pre-extracted `submissionDate`. Rules read only from context; they never reach outside it.

`SimilarityRule` — the contract each rule must satisfy: `name`, `weight`, `calculate(context)`, and the optional `isApplicable(context)` guard. Rules return a score in [0, 1]. The special name `"exact"` enables the short-circuit path in `SimilarityEngine`.

Adding a new rule: implement this interface, mark it `@Injectable()`, add it to `IngestionModule` providers, and inject it into the `SIMILARITY_RULES` factory. No changes to `SimilarityEngine` or `RuleEvaluator` are required — Open/Closed principle.

---

## mappers/

**`event-datetime.mapper.ts`** — `EventDateTimeMapper`, converts a validated `SubmitEventDto` into an `EventSubmission` domain object. Converts ISO 8601 strings to hydrated `Date` objects and assembles the correct `EventDateTime` union shape based on `dto.type`.

This class lives in `ingestion/mappers/` because it maps ingestion-specific DTOs. The previous location (`events/mappers/`) caused `events/` to import `SubmitEventDto` from `ingestion/` — a cross-module DTO dependency pointing in the wrong direction.

---

## ports/

**`candidate-repository.port.ts`** — `ICandidateRepository` (`CANDIDATE_REPOSITORY` token). Single method: `findCandidatesInWindow(from, to)` returning `EventSummary[]`. The return type is intentionally `EventSummary` and not the `Event` entity — ingestion has no business knowing about ORM internals. The repository implementation handles the `Event → EventSummary` projection internally.

**`similarity-engine.port.ts`** — `ISimilarityEngine` (`SIMILARITY_ENGINE` token). Single method: `findSimilar(submission)` returning `ScoredEvent[]`. `IngestionService` depends on this interface rather than on `SimilarityEngine` directly, making the pipeline trivially testable.

---

## rules/

Four concrete rules registered via the `SIMILARITY_RULES` injection token:

**`exact-match.rule.ts`** — `ExactMatchRule`. Returns 1.0 when title + venue + date all match exactly; 0 otherwise. The engine short-circuits on a 1.0 score from this rule — no further scoring needed.

**`title-similarity.rule.ts`** — `TitleSimilarityRule`. Weight 0.5 (strongest signal). Extends `TextSimilarityRule`.

**`venue-similarity.rule.ts`** — `VenueSimilarityRule`. Weight 0.3. Extends `TextSimilarityRule`. Overrides `substringScore` to return a fixed 0.9 — partial venue name matches (e.g. "ACE" matching "ACE Conference Hall, ICT") are highly reliable.

**`date-proximity.rule.ts`** — `DateProximityRule`. Weight 0.2. Scores linearly: 1.0 for the same day, decaying to 0 at 7 days apart. Has an `isApplicable` guard — if the submission date cannot be parsed, the rule is skipped rather than throwing.

### base/

**`text-similarity.rule.ts`** — `TextSimilarityRule`, the abstract base for all string-field rules. Implements the shared algorithm once (normalise → exact match → substring containment → Jaccard word overlap); subclasses provide only `extractField` and `noisePattern`. This eliminates the duplicated normalisation and Jaccard logic that previously existed in both the title and venue rules.

---

## scoring/

**`rule-evaluator.ts`** — `RuleEvaluator`. Runs all non-exact rules concurrently via `Promise.allSettled`. A failing rule is logged and excluded from the weighted average without affecting others. Logs per-rule diagnostic scores internally — these never surface in the port contract or any HTTP response. Returns a fully assembled `ScoredEvent`.

The evaluator is instantiated inside `SimilarityEngine`'s constructor rather than registered as a provider, because it is an internal implementation detail of the engine, not a port boundary.

---

## ingestion.service.ts

Orchestrates the two pipeline steps:

**`submit`**: maps DTO → `EventSubmission`, scores against existing events, returns `created` / `linked` / `needs_decision` based on results.

**`confirm`**: if `decision=duplicate`, links immediately. If `decision=new`, re-runs the similarity check — exact matches override the submitter's decision. Clean submissions are wrapped in a transaction via `ITransactionManager`.

The service has zero ORM imports and zero cross-module mapper imports. All persistence flows through injected port interfaces.

---

## ingestion.module.ts

Imports `EventsModule` to receive `EVENT_CREATOR`, `CANDIDATE_REPOSITORY`, and `TRANSACTION_MANAGER` tokens. Declares all four rules as providers, then assembles them into the `SIMILARITY_RULES` array via a factory. No direct MikroORM or entity imports at this level.
