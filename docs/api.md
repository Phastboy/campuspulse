# API Reference

Base URL: `http://localhost:3000/api`

All responses are wrapped in the `ApiResponse<T>` envelope:

```json
// Success
{ "success": true, "data": { ... }, "timestamp": "2026-02-28T10:00:00.000Z" }

// Failure
{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." }, "timestamp": "..." }
```

---

## Ingestion — two-step submission pipeline

The ingestion pipeline handles all event submissions. It validates, scores for duplicates, and either auto-publishes, auto-links, or asks the submitter to resolve ambiguity.

### `POST /ingestion/submit`

Submit an event. Three possible outcomes:

| `action` | Meaning | Next step |
|----------|---------|-----------|
| `created` | New event — no duplicates found. Published immediately. | Done. |
| `linked` | Exact duplicate detected. Linked to existing event. | Done. |
| `needs_decision` | Similar events found. Submitter must resolve. | Call `/ingestion/confirm`. |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✓ | Event title |
| `type` | `"specific"` \| `"all-day"` | ✓ | Datetime shape |
| `date` | ISO date string | ✓ | Event date (`YYYY-MM-DD`) |
| `startTime` | ISO datetime string | if `type=specific` | Event start time |
| `endTime` | ISO datetime string | | Event end time (optional) |
| `endDate` | ISO date string | if `type=all-day` | End date for multi-day events |
| `venue` | string | ✓ | Venue name |
| `description` | string | | Free-text description |

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

**Response — auto-created:**
```json
{
  "success": true,
  "data": {
    "action": "created",
    "message": "Event published successfully",
    "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

**Response — needs decision:**
```json
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
          "datetime": {
            "type": "specific",
            "date": "2026-02-28T00:00:00.000Z",
            "startTime": "2026-02-28T10:00:00.000Z"
          },
          "venue": "ACE Conference Hall, ICT"
        },
        "score": 0.95,
        "matches": { "title": true, "venue": true, "date": true }
      }
    ],
    "originalSubmission": { "title": "...", "type": "specific", "..." : "..." }
  }
}
```

---

### `POST /ingestion/confirm`

Resolve a `needs_decision` submission. Pass the `originalSubmission` object from the submit response plus a `decision` field.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `decision` | `"new"` \| `"duplicate"` | ✓ | Submitter's resolution |
| `existingEventId` | UUID | if `decision=duplicate` | The event to link to |
| *(+ all fields from the original submission)* | | | |

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

## Events — read and manage published events

### `GET /events`

Returns published events ordered by date ascending.

| Query param | Type | Description |
|-------------|------|-------------|
| `fromDate` | ISO date | Include events on or after this date |
| `toDate` | ISO date | Include events on or before this date |
| `type` | `"specific"` \| `"all-day"` | Filter by datetime shape |
| `limit` | integer (min 1) | Max results to return. Default: 20 |
| `offset` | integer (min 0) | Results to skip. Default: 0 |

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

---

### `GET /events/venue/:venue`

Case-insensitive partial match on venue name. Useful before submitting to check what is already at a venue.

```bash
curl http://localhost:3000/api/events/venue/Trust%20Hall
curl http://localhost:3000/api/events/venue/ACE
```

---

### `GET /events/:id`

Returns a single event by UUID.

```bash
curl http://localhost:3000/api/events/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

Returns `404` if not found.

---

### `PATCH /events/:id`

Partial update. Only provided fields are changed.

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

Returns `404` if not found, `400` if the update payload is invalid.

---

### `DELETE /events/:id`

Hard delete. Returns `204 No Content` on success.

Prefer updating `description` to note a cancellation — students who saved the event link will still find a record. Hard delete removes it entirely.

```bash
curl -X DELETE http://localhost:3000/api/events/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## Similarity scoring

The duplicate detection engine scores submissions against candidates within a ±7 day window using four rules:

| Rule | Weight | Logic |
|------|--------|-------|
| `exact` | short-circuit | title + venue + same day → 1.0 immediately |
| `title` | 0.5 | Jaccard word overlap + substring containment |
| `venue` | 0.3 | Jaccard word overlap + substring containment |
| `date` | 0.2 | Linear decay over 7-day window |

Candidates below a 0.3 aggregate score are discarded. A score of 1.0 on the `exact` rule stops all further scoring and triggers an auto-link.

The `matches` map in a `needs_decision` response shows which individual rules exceeded 0.7 — these are the dimensions where the submission and candidate are most alike.
