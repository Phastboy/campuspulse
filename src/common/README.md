# common/

Shared code used by more than one feature module. Everything here is depended upon — nothing here depends on anything outside this directory.

**Hard rule: nothing in `common/` may import from a feature module (`events/`, `ingestion/`, or any future module).** Violations break the dependency hierarchy and introduce circular imports. If you find yourself writing `import ... from '../events/...'` inside `common/`, the code belongs in the feature module or in a domain type, not here.

```
common/
├── constants/     Shared discriminator values and their derived union types
├── datetime/      EventDateTime discriminated union and DateParseResult
├── dto/           Shared base DTOs used by multiple feature modules
├── filters/       Global NestJS exception filter
└── ports/         ITransactionManager — the one port that crosses module boundaries
```

---

## constants/

Two `const` tuples that double as runtime arrays and TypeScript union sources:

`datetime.constants.ts` — `DATETIME_TYPES = ['specific', 'all-day']` and the derived `DatetimeType` union. Pass `DATETIME_TYPES` to `@IsIn()` validators; the union ensures type-safe narrowing everywhere else.

`ingestion.constants.ts` — `SUBMISSION_DECISIONS = ['new', 'duplicate']` and the derived `SubmissionDecision` union. Same pattern.

Adding a new datetime shape or decision value means changing the array here — the union type and all validators update automatically.

---

## datetime/

The `EventDateTime` discriminated union — the central type that describes when an event happens:

```ts
type EventDateTime = SpecificDateTime | AllDayDate;
```

Narrow on `datetime.type` before accessing shape-specific fields (`startTime`, `endTime`, `endDate`). Both the domain layer and the infrastructure layer use this type, which is why it lives in `common/` rather than in either feature module.

Also exports `DateParseResult` — used internally when parsing raw JSONB values from PostgreSQL.

---

## dto/

**`api-response.dto.ts`** — `ApiResponse<T>`, the envelope that wraps every API response. Use the static factory methods:

```ts
return ApiResponse.ok(event);
return ApiResponse.fail('NOT_FOUND', 'Event not found', { id });
```

The constructor is private — incomplete envelope objects cannot be created accidentally.

**`event-fields.dto.ts`** — `EventFieldsDto`, the shared base class for submission and update DTOs. Both `SubmitEventDto` (ingestion) and `UpdateEventDto` (events) extend this. It exists specifically to prevent those two modules from importing each other — a cross-module DTO dependency that previously existed before this base class was introduced.

---

## filters/

`AllExceptionsFilter` — a global NestJS exception filter that catches all unhandled exceptions and formats them into `ApiResponse.fail(...)` envelopes. Registered in `main.ts`.

Without this, NestJS's default error format would bypass the `ApiResponse` envelope and expose framework internals to clients.

---

## ports/

`transaction-manager.port.ts` — `ITransactionManager` and its injection token `TRANSACTION_MANAGER`.

This port lives in `common/` rather than in `events/` or `ingestion/` because it crosses module boundaries: the concrete implementation (`MikroOrmTransactionManager`) is registered in `EventsModule`, and the consumer (`IngestionService`) lives in `IngestionModule`. Both need to import from the same place to agree on the token and interface — that place is `common/`.

This is the only port in `common/`. All other ports belong to the feature module that owns their domain type.
