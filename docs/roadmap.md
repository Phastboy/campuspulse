# Roadmap

CampusPulse is being built in phases. Each phase builds on the previous one without requiring the pipeline or domain layer to change.

---

## Phase 1 — Current

**Manual curation + crowdsourced submission**

- Events are submitted via `POST /api/ingestion/submit`
- The similarity engine auto-publishes clean submissions and flags ambiguous ones
- Curators review and correct events via the events CRUD endpoints
- No authentication — the API is open

The infrastructure (Docker, nginx, CI) is production-ready. The event model and ingestion pipeline are stable.

---

## Phase 2 — Auth + moderation queue

**What changes:**

- Auth module added: JWT-based authentication, user roles (submitter, moderator, admin)
- Moderation queue: flagged submissions go to a queue instead of being returned to the submitter directly
- Moderators approve, reject, or merge events from the queue
- Push notifications: students can subscribe to events or categories and receive FCM notifications

**What does not change:**

- The ingestion pipeline logic is unchanged — the similarity engine, scoring rules, and port contracts are identical
- The events domain layer is unchanged
- Existing API endpoints remain compatible

---

## Phase 3 — Organiser dashboard

**What changes:**

- Organisers can claim events and manage them directly, bypassing the crowdsourced submission flow
- A new `AggregationSource` abstraction is introduced — the organiser dashboard is one implementation; crowdsourced submission is another
- Admin panel for managing users, sources, and feed quality

**What does not change:**

- Zero changes to the ingestion pipeline
- Zero changes to the similarity engine
- The events domain layer is unchanged

---

## Design principle

Each phase adds new implementations of existing ports, or new ports with new implementations. The domain layer and the ingestion pipeline are designed to never change as new capabilities are added — only extended at the edges.
