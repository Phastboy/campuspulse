# CampusPulse

Campus event aggregation platform for OAU (Obafemi Awolowo University).

Events at OAU are announced across dozens of WhatsApp groups, departmental notice boards, and student union channels — with no single place to find them all. CampusPulse aggregates them into one unified feed, so students always know what is happening on campus.

---

## What it does

- Accepts event submissions from students and curators via a simple HTTP API
- Automatically detects duplicate submissions before they reach the feed
- Publishes clean events to a searchable, filterable event listing
- Lets curators correct or remove events after the fact

The duplication problem is handled by a weighted similarity engine that scores incoming submissions against existing events and either auto-publishes, auto-links, or asks the submitter to resolve ambiguity — without manual moderation for every submission.

---

## Project status

Phase 1 is live: manual curation and crowdsourced submission via this API.

See [`docs/roadmap.md`](docs/roadmap.md) for what comes next.

---

## For developers

Everything you need to run, contribute to, or understand the codebase:

| Document | What it covers |
|----------|---------------|
| [`docs/setup.md`](docs/setup.md) | Local development setup, environment variables, Docker |
| [`docs/api.md`](docs/api.md) | All API endpoints with request/response examples |
| [`docs/architecture.md`](docs/architecture.md) | Layer diagram, port map, dependency graph (auto-generated) |
| [`docs/contributing.md`](docs/contributing.md) | How to contribute — branching, commits, PR checklist |
| [`docs/roadmap.md`](docs/roadmap.md) | Planned phases and what changes in each |
| [`src/README.md`](src/README.md) | Source tree orientation |

---

## Stack

| Concern | Technology |
|---------|-----------|
| Framework | NestJS 11 |
| ORM | MikroORM 6 (PostgreSQL driver) |
| Database | PostgreSQL 14+ |
| Validation | class-validator + class-transformer |
| Config validation | Zod |
| API docs | Swagger (optional, basic-auth protected) |
| Package manager | pnpm |

---

## Licence

ISC
