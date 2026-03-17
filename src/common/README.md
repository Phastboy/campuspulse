# common/

Shared primitives used across the entire codebase. Everything here is a leaf — it depends on nothing inside `src/` except itself.

**Hard rule: nothing in `common/` may import from any other `src/` directory.** If you find yourself writing `import ... from '@domain/...'` or `import ... from '@services/...'` inside `common/`, the code belongs elsewhere.

```
common/
├── constants/   Discriminator tuples and their derived union types
├── datetime/    EventDateTime discriminated union and DateParseResult
└── filters/     AllExceptionsFilter — global NestJS exception filter
```

---

## constants/

Two `const` tuples that serve double duty as runtime arrays and TypeScript union sources:

**`datetime.constants.ts`** — `DATETIME_TYPES = ['specific', 'all-day']` and the derived `DatetimeType` union. Pass `DATETIME_TYPES` to `@IsIn()` validators; use `DatetimeType` for type-safe narrowing.

**`ingestion.constants.ts`** — `SUBMISSION_DECISIONS = ['new', 'duplicate']` and the derived `SubmissionDecision` union. Same pattern.

Adding a new datetime shape or decision value means changing the array here — the union type and all validators that reference it update automatically.

---

## datetime/

The `EventDateTime` discriminated union — the central type describing when an event happens:

```ts
type EventDateTime = SpecificDateTime | AllDayDate
```

Narrow on `datetime.type` before accessing shape-specific fields (`startTime`, `endTime`, `endDate`). Both the domain layer and the infrastructure layer use this type, which is why it lives here rather than in either.

Also exports `DateParseResult` — used internally when handling raw JSONB values from PostgreSQL.

---

## filters/

**`all-exceptions.filter.ts`** — `AllExceptionsFilter`, a global NestJS exception filter that catches all unhandled exceptions and formats them into `ApiResponse.fail(...)` envelopes. Registered in `main.ts` via `app.useGlobalFilters`. Without this, NestJS's default error format would bypass the `ApiResponse` envelope on unhandled errors.
