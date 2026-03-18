# Contributing

Thanks for contributing to CampusPulse. This document covers the workflow, conventions, and checklist for getting a PR merged.

---

## Getting started

1. Fork the repository and clone your fork
2. Follow [`setup.md`](setup.md) to get the project running locally
3. Create a branch from `main` for your change

---

## Branching

| Prefix | Use for |
|--------|---------|
| `feat/` | New features or behaviour |
| `fix/` | Bug fixes |
| `refactor/` | Internal changes with no behaviour change |
| `docs/` | Documentation only |
| `chore/` | Tooling, config, dependencies |

---

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short summary>
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`. Keep the summary under 72 characters. Use the body to explain *why*, not *what*.

---

## Architecture rules

Read [`docs/architecture.md`](architecture.md) before writing code. The rules that must not be broken:

- `domain/` imports nothing from `src/` and nothing from npm — it must compile standalone
- `ports/` imports only from `@domain` and `@application/types` — same zero-npm-dependency guarantee
- `application/types/` imports only from `@domain` — no framework, no ORM, no HTTP
- Services depend on ports only — never import from `@infrastructure` directly
- Controllers contain no business logic — map DTOs to application types, call a service, map back
- Services return application types (`IngestionOutcome`, `SimilarityMatch`) — never Swagger-decorated DTOs
- The mapping from application types to HTTP DTOs happens exclusively in controllers
- `common/` imports nothing from `src/` — it is a pure utility with no domain knowledge
- MikroORM imports are permitted only in `src/infrastructure/`
- Every ORM entity must `implement` its corresponding domain interface from `@domain/interfaces`
- Each adapter class implements exactly one port interface — never two or more

A PR that breaks a layer boundary will not be merged regardless of CI status.

---

## Where new code goes

| What you're adding | Where it goes |
|--------------------|--------------|
| New domain concept (what a thing *is*) | `src/domain/interfaces/` or `src/domain/value-objects/` |
| New domain error | `src/domain/errors/` |
| New application coordination type | `src/application/types/` |
| New port | `src/ports/` |
| New adapter (one per port) | `src/infrastructure/adapters/` |
| New ORM entity | `src/infrastructure/entities/` |
| New service | `src/services/` |
| New controller | `src/controllers/` |
| New DTO | `src/dto/` |
| New mapper | `src/mappers/` |
| New similarity rule | `src/rules/` |
| New config | `src/configs/` |
| New NestJS module | `src/modules/` |

---

## PR checklist

**Code**
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes
- [ ] No layer boundary violations (see architecture rules above)
- [ ] No MikroORM imports outside `src/infrastructure/`
- [ ] Every new ORM entity implements its domain interface

**Tests**
- [ ] Existing tests pass (`pnpm test`)
- [ ] New behaviour has unit tests

**Documentation**
- [ ] Structural changes: run `pnpm arch` to regenerate `docs/architecture.md`
- [ ] New endpoints: update `docs/api.md`
- [ ] New config variables: update `docs/setup.md`
- [ ] New directory: add a `README.md`

---

## Running checks locally

```bash
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm arch    # if structure changed
```
