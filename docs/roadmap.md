# Roadmap

CampusPulse is being built in phases. Each phase extends the system without requiring changes to the core ingestion pipeline or the events domain model.

The design goal is **stability at the core and extensibility at the edges**.

---

# Phase 1 — Current

**Manual curation + crowdsourced submission**

* Events are submitted via `POST /api/ingestion/submit`
* The similarity engine detects duplicates and related events before persistence
* Clean submissions are automatically published
* Ambiguous submissions are flagged for later inspection
* Curators can correct events using the events CRUD endpoints

The API is currently open, allowing anyone to submit events.

Infrastructure (Docker, nginx, CI) is already production-ready, and the ingestion pipeline and event model are considered stable.

---

# Phase 2 — Authentication + submission tracking

**Goal:** ensure submissions come from real students and enable user-based analytics and trust systems.

## What changes

* Authentication is introduced using JWT
* Users must authenticate before submitting events
* Accounts are restricted to verified school email domains
* Submissions are associated with a user record
* Admin authentication allows administrative event management and ingestion overrides

Initial roles remain minimal:

* `user`
* `admin`

Every authenticated user can submit events. The system remains crowdsourced.

User records enable future features such as:

* reputation scoring
* spam detection
* submission analytics
* trust-based ingestion rules

## What does not change

* The ingestion pipeline logic remains identical
* The similarity engine and scoring rules remain unchanged
* The events domain layer is unchanged
* Existing API endpoints remain compatible

Authentication is added at the API boundary without modifying the core ingestion system.

---

# Phase 3 — Organiser dashboard

**Goal:** allow event organisers to manage their events directly.

## What changes

* Organisers can claim or create events through a dashboard
* Organiser-managed events bypass the crowdsourced submission flow
* A new `AggregationSource` abstraction is introduced to support multiple event sources
* Admin tools are expanded for managing users, sources, and feed quality

## What does not change

* The ingestion pipeline remains unchanged
* The similarity engine remains unchanged
* The events domain layer remains unchanged

Crowdsourced submission and organiser-managed events coexist as separate ingestion sources.

---

# Phase 4 — Discovery and notifications

**Goal:** improve how students discover relevant events.

Potential additions include:

* event subscriptions
* category following
* personalised event feeds
* trending events
* push notifications for upcoming events

These features build on the existing event data without modifying the ingestion pipeline.

---

# Design Principle

The system follows a strict architectural rule:

Core systems should **not change as new features are added**.

New capabilities are implemented by:

* adding new implementations of existing ports
* introducing new ports with separate implementations
* extending infrastructure and API layers

The ingestion pipeline, similarity engine, and events domain model are designed to remain stable while the platform evolves.
