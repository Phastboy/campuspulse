# CampusPulse API

Campus event aggregation platform for OAU — NestJS 11 · MikroORM 6 · PostgreSQL.

Events at OAU are announced across dozens of WhatsApp groups. CampusPulse aggregates them into a single feed. This repository is the backend API.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11 |
| ORM | MikroORM 6 (PostgreSQL driver) |
| Database | PostgreSQL 14+ |
| Validation | class-validator + class-transformer |
| Config validation | Zod |
| API docs | Swagger (optional, basic-auth protected) |
| Package manager | pnpm |

---

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PostgreSQL 14+ running locally or a connection URL (Supabase, Railway, etc.)

---

## Setup

```bash
# 1. Clone and install
git clone https://github.com/Phastboy/campuspulse
cd campuspulse
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env — the only required value is DATABASE_URL

# 3. Run migrations
pnpm migration:up

# 4. Start dev server
pnpm dev
```

API is available at `http://localhost:3000/api`.

---

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✓ | — | PostgreSQL connection string |
| `NODE_ENV` | | `development` | `development` \| `production` \| `test` |
| `PORT` | | `3000` | HTTP port |
| `GLOBAL_PREFIX` | | `api` | URL prefix for all routes |
| `SWAGGER_ENABLED` | | `false` | Enable Swagger UI |
| `SWAGGER_USER` | if enabled | — | Basic auth username for docs |
| `SWAGGER_PASS` | if enabled | — | Basic auth password for docs |
| `SWAGGER_SECURITY_NAME` | if enabled | — | Bearer auth scheme name in Swagger |
| `SWAGGER_PATH_DOCS` | | `api/docs` | Swagger UI path |
| `SWAGGER_PATH_JSON` | | `api/docs-json` | OpenAPI JSON path |

---

## API

### Ingestion — two-step submission pipeline

The ingestion pipeline handles all event submissions. It validates, scores for duplicates, and either auto-publishes or asks the submitter to resolve ambiguity.

#### `POST /api/ingestion/submit`

Submit an event. Three possible outcomes:

| `action` | Meaning | Next step |
|----------|---------|-----------| 
| `created` | New event — no duplicates found. Published immediately. | Done. |
| `linked` | Exact duplicate detected. Linked to existing event. | Done. |
| `needs_decision` | Similar events found. Submitter must resolve. | Call `/ingestion/confirm`. |

```bash
curl -X POST http://localhost:3000/api/ingestion/submit \
  -H "Content-Type: application/json" \
  -d '{
    "title": "NACOS Parliamentary Summit 2026",
    "type": "specific",
    "date": "2026-02-28",
    "startTime": "2026-02-28T10:00:00.000Z",
    "venue": "ACE Conference Hall, ICT"
  }'
```

```json
// Response — auto-created
{
  "success": true,
  "data": {
    "action": "created",
    "message": "Event published successfully",
    "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

```json
// Response — needs decision
{
  "success": true,
  "data": {
    "action": "needs_decision",
    "message": "Similar events found. Is this the same event?",
    "similar": [
      {
        "event": {
          "id": "existing-uuid",
          "title": "NACOS Parliamentary Summit 2026",
          "datetime": { "type": "specific", "date": "2026-02-28T00:00:00.000Z", "startTime": "2026-02-28T10:00:00.000Z" },
          "venue": "ACE Conference Hall, ICT"
        },
        "score": 0.95,
        "matches": { "title": true, "venue": true, "date": true }
      }
    ],
    "originalSubmission": { "title": "...", "type": "specific" }
  }
}
```

#### `POST /api/ingestion/confirm`

Resolve a `needs_decision` submission. Pass the `originalSubmission` from the previous response plus a `decision` field.

```bash
curl -X POST http://localhost:3000/api/ingestion/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "duplicate",
    "existingEventId": "existing-uuid",
    "title": "NACOS Parliamentary Summit 2026",
    "type": "specific",
    "date": "2026-02-28",
    "startTime": "2026-02-28T10:00:00.000Z",
    "venue": "ACE Conference Hall, ICT"
  }'
```

**Trust model:** `decision: "new"` is not unconditionally trusted. If an exact match exists (score 1.0 on title + venue + date), the engine overrides the decision and links anyway. Submitters cannot force duplicates into the system.

---

### Events — read and manage published events

#### `GET /api/events`

```bash
# All events
curl http://localhost:3000/api/events

# Filter by date range
curl "http://localhost:3000/api/events?fromDate=2026-02-28&toDate=2026-02-28"

# Paginate
curl "http://localhost:3000/api/events?limit=10&offset=20"

# Filter by datetime type
curl "http://localhost:3000/api/events?type=specific"
```

#### `GET /api/events/venue/:venue`

Case-insensitive partial match. Useful before submitting to check what is already at a venue.

```bash
curl http://localhost:3000/api/events/venue/Trust%20Hall
curl http://localhost:3000/api/events/venue/ACE
```

#### `GET /api/events/:id`

```bash
curl http://localhost:3000/api/events/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

#### `PATCH /api/events/:id`

All fields optional. Only provided fields are updated.

```bash
# Reschedule
curl -X PATCH http://localhost:3000/api/events/uuid \
  -H "Content-Type: application/json" \
  -d '{ "date": "2026-03-07", "type": "specific", "startTime": "2026-03-07T10:00:00.000Z" }'

# Update venue only
curl -X PATCH http://localhost:3000/api/events/uuid \
  -H "Content-Type: application/json" \
  -d '{ "venue": "New Admin Block, Room 101" }'
```

#### `DELETE /api/events/:id`

Hard delete. Prefer updating `description` to note a cancellation — students who saved the link will still find a record.

---

## Database migrations

```bash
# Generate a migration from entity changes
pnpm migration:create

# Apply pending migrations
pnpm migration:up

# Roll back last migration
pnpm migration:down

# List all migrations and their status
pnpm migration:list
```

---

## Swagger docs

Set `SWAGGER_ENABLED=true` in `.env` along with `SWAGGER_USER`, `SWAGGER_PASS`, and `SWAGGER_SECURITY_NAME`.

Docs are at `http://localhost:3000/api/docs` (basic auth protected).
OpenAPI JSON is at `http://localhost:3000/api/docs-json`.

---

## Architecture

The codebase is layered with enforced boundaries. Each layer may only depend inward — never outward or sideways across sibling modules.

```
HTTP (controllers, DTOs)
      ↓
Application (services)
      ↓
Domain (interfaces, domain types, errors)
      ↓
Infrastructure (repositories, ORM, transaction manager)
```

### Layer rules

| Layer | May import from | May NOT import from |
|-------|----------------|---------------------|
| HTTP (controllers) | Application, Domain, `@common` | Infrastructure |
| Application (services) | Domain, Ports, `@common` | Infrastructure directly, HTTP types |
| Domain (types, errors, port interfaces) | `@common` only | Application, Infrastructure, HTTP |
| Infrastructure (repositories) | Domain, ORM | Application, HTTP |

### Ports and implementations

Every cross-layer dependency flows through an interface (a "port"). Services declare what they need; modules wire in the concrete implementation at startup.

| Port | Token | Implementation | Consumer(s) |
|------|-------|---------------|-------------|
| `IEventReader` | `EVENT_READER` | `MikroOrmEventRepository` | `EventsService` |
| `IEventWriter` | `EVENT_WRITER` | `MikroOrmEventRepository` | `EventsService`, `IngestionService` |
| `ICandidateRepository` | `CANDIDATE_REPOSITORY` | `MikroOrmEventRepository` | `SimilarityEngine` |
| `ITransactionManager` | `TRANSACTION_MANAGER` | `MikroOrmTransactionManager` | `IngestionService` |
| `ISimilarityEngine` | `SIMILARITY_ENGINE` | `SimilarityEngine` | `IngestionService` |

`MikroOrmEventRepository` and `MikroOrmTransactionManager` are the only classes that import MikroORM. Swapping to Prisma means rewriting those two classes and nothing else.

### Boundary fixes applied in this session

**`PaginatedEvents` moved to `events/domain/`**
Previously defined inside `events.service.ts` and imported by the port and repository — a port importing from a service. Domain types belong in `domain/`, not in service files.

**`EventQuery` domain type introduced**
`IEventReader.findAll` previously accepted `EventQueryDto` (an HTTP DTO). Port interfaces must use domain types only. `EventQuery` is the domain-level equivalent; the controller maps `EventQueryDto → EventQuery` at the HTTP boundary.

**`EventDateTimeMapper` moved to `ingestion/mappers/`**
Previously lived in `events/mappers/` but imported `SubmitEventDto` from `ingestion/dto/` — an `events/` file depending on `ingestion/`. It maps ingestion DTOs so it belongs in `ingestion/`.

**`EventFieldsDto` base class introduced in `common/dto/`**
`UpdateEventDto` (events module) extended `SubmitEventDto` (ingestion module) — a cross-module DTO dependency. Both now extend `EventFieldsDto` from `common/`. Neither module depends on the other.

**`InvalidDatetimeError` introduced in `events/domain/`**
`EventDateTimeAssembler` (a domain mapper) threw `BadRequestException` — an NestJS HTTP class. Domain logic must not depend on HTTP frameworks. The assembler now throws `InvalidDatetimeError` (a plain `Error` subclass). `EventsService` catches it and translates to `BadRequestException` at the HTTP boundary.

**`ICandidateRepository` returns `EventSummary[]` not `Event[]`**
The previous contract returned the full ORM entity to ingestion consumers. Ingestion has no business knowing about the `Event` entity class. The repository now projects `Event → EventSummary` internally; `SimilarityEngine` no longer imports the entity.

### Dependency graph

```
IngestionController
  └── IngestionService
        ├── ISimilarityEngine    ←── SimilarityEngine
        │                              └── ICandidateRepository ←── MikroOrmEventRepository
        ├── IEventWriter         ←── MikroOrmEventRepository
        ├── ITransactionManager  ←── MikroOrmTransactionManager
        └── EventDateTimeMapper  (ingestion/mappers — maps ingestion DTOs)

EventsController
  └── EventsService
        ├── IEventReader   ←── MikroOrmEventRepository
        ├── IEventWriter   ←── MikroOrmEventRepository
        └── EventDateTimeAssembler  (pure domain — no HTTP imports)
```

No arrow crosses a module boundary pointing at a concrete class. No port imports from a service. No domain class imports from an HTTP framework.

---

## Project structure

```
src/
├── common/
│   ├── constants/     # DATETIME_TYPES, SUBMISSION_DECISIONS
│   ├── datetime/      # EventDateTime union, DateParseResult
│   ├── dto/
│   │   ├── api-response.dto.ts    # ApiResponse<T> envelope
│   │   └── event-fields.dto.ts    # Shared base DTO (events + ingestion extend this)
│   ├── filters/       # AllExceptionsFilter
│   └── ports/
│       └── transaction-manager.port.ts   # ITransactionManager
├── config/
│   └── validation.ts              # Zod env schema
├── database/
│   ├── migrations/
│   └── mikro-orm.config.ts
├── events/
│   ├── domain/
│   │   ├── event-query.ts         # Domain query params (used by IEventReader)
│   │   ├── event-submission.ts    # Normalised submission flowing through the pipeline
│   │   ├── event-summary.ts       # Minimal ORM-free projection used by ingestion
│   │   ├── invalid-datetime.error.ts   # Domain error — no HTTP dependency
│   │   └── paginated-events.ts    # Shared result type for IEventReader + service
│   ├── dto/
│   │   ├── create-event.dto.ts
│   │   ├── event-query.dto.ts     # HTTP input; controller maps this → EventQuery
│   │   └── update-event.dto.ts    # extends EventFieldsDto from common/
│   ├── entities/
│   │   └── event.entity.ts        # MikroORM entity
│   ├── mappers/
│   │   └── event-datetime.assembler.ts  # Merges partial update onto EventDateTime
│   ├── ports/
│   │   ├── event-reader.port.ts   # IEventReader — uses EventQuery + EventSummary
│   │   └── event-writer.port.ts   # IEventWriter
│   ├── repositories/
│   │   ├── mikro-orm-event.repository.ts     # Sole MikroORM impl — projects Event→EventSummary
│   │   └── mikro-orm-transaction-manager.ts  # Wraps em.transactional
│   ├── events.controller.ts  # Maps EventQueryDto→EventQuery; HTTP boundary
│   ├── events.service.ts     # Catches InvalidDatetimeError → BadRequestException
│   └── events.module.ts
└── ingestion/
    ├── dto/
    │   ├── confirm-submission.dto.ts
    │   ├── ingestion-result.dto.ts
    │   ├── similarity.dto.ts
    │   └── submit-event.dto.ts    # extends EventFieldsDto from common/
    ├── helpers/
    │   └── event-date.helper.ts   # getComparableDateFromSummary
    ├── interfaces/
    │   └── similarity-rule.interface.ts   # SimilarityRule, SimilarityContext
    ├── mappers/
    │   └── event-datetime.mapper.ts   # Maps SubmitEventDto → EventSubmission
    ├── ports/
    │   ├── candidate-repository.port.ts  # ICandidateRepository → returns EventSummary[]
    │   └── similarity-engine.port.ts     # ISimilarityEngine
    ├── rules/
    │   └── …
    ├── ingestion.controller.ts
    ├── ingestion.service.ts    # Zero ORM imports; zero cross-module mapper imports
    ├── ingestion.module.ts     # Imports EventsModule only; no MikroOrmModule
    └── similarity-engine.service.ts  # Operates entirely on EventSummary
```
## Similarity engine

Duplicate detection uses a weighted multi-rule scoring engine. Each candidate event within ±7 days of the submission is scored against four rules:

| Rule | Weight | Logic |
|------|--------|-------|
| `exact` | short-circuit | title + venue + same day → 1.0 immediately |
| `title` | 0.5 | Jaccard word overlap + substring containment |
| `venue` | 0.3 | Jaccard word overlap + substring containment |
| `date` | 0.2 | Linear decay over 7-day window |

Candidates below 0.3 aggregate score are discarded. Scores are a weighted average of applicable rules.

---

## Phase roadmap

| Phase | What changes |
|-------|-------------|
| **Current (Phase 1)** | Manual curation + crowdsourced submission via this API |
| **Phase 2** | Auth module (JWT), moderator queue, push notifications via FCM |
| **Phase 3** | Organiser dashboard — a new `AggregationSource` implementation, zero pipeline changes |
