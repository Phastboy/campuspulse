# domain/

The innermost layer. **Zero imports from any npm package. Zero imports from any other `src/` directory.** Must compile and produce no runtime errors with no packages installed — it is pure TypeScript.

```
domain/
├── interfaces/      Entity contracts that infrastructure must implement
├── value-objects/   Domain value types and their valid value sets
└── errors/          Domain errors — plain Error subclasses, no framework imports
```

---

## interfaces/

**`event.interface.ts`** — `IEvent`. The contract every event entity must satisfy. The ORM entity (`infrastructure/entities/event.entity.ts`) implements this — domain dictates, infrastructure conforms.

Port interfaces use `IEvent` as their return type, so services and the application layer never depend on the ORM entity class directly.

---

## value-objects/

**`event-datetime.ts`** — `EventDateTime` discriminated union (`SpecificDateTime | AllDayDate`). The canonical type for when an event occurs. Stored as JSONB in the database. Lives here because it is a domain concept — not an HTTP shape, not a persistence detail.

**`datetime-types.ts`** — `DATETIME_TYPES` const tuple and the derived `DatetimeType` union. The tuple is passed to `@IsIn()` validators in DTOs; the union type is used for type-safe narrowing everywhere else. Lives here because valid datetime type values are a domain invariant.

**`submission-decisions.ts`** — `SUBMISSION_DECISIONS` const tuple and `SubmissionDecision` union. Same pattern. The valid decisions (`'new' | 'duplicate'`) are a domain concept.

---

## errors/

**`invalid-datetime.error.ts`** — `InvalidDatetimeError`. Plain `Error` subclass thrown by `EventDateTimeAssembler` when a datetime update is structurally invalid. No NestJS imports — `EventsService` catches it and translates to `BadRequestException` at the HTTP boundary.

---

## Rules for this directory

- No imports from `@nestjs/*`, `@mikro-orm/*`, or any npm package
- No imports from any other `src/` directory
- No decorators of any kind
- If you need to reference something from outside domain here, the design is wrong — the outside thing should depend on domain, not the reverse
