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

- Dependencies flow inward only: HTTP → Application → Ports → Domain ← Infrastructure
- `domain/` must not import from any framework, ORM, or HTTP library — only `@common`
- Services must not import from `@infrastructure` directly — only through port interfaces
- Controllers must not contain business logic — delegate entirely to services
- Port interfaces use only domain types in their signatures — no DTOs, no ORM entities, no Swagger decorators
- Services return domain types — never HTTP DTOs decorated with `@ApiProperty`
- The mapping from domain types to HTTP DTOs happens exclusively in controllers
- Nothing in `@common` may import from any other `src/` directory
- MikroORM imports are permitted only in `src/infrastructure/`
- Every ORM entity must `implement` its corresponding domain interface from `@domain/interfaces`

A PR that breaks a layer boundary will not be merged regardless of CI status.

---

## Where new code goes

With the flat structure, placement is unambiguous:

| What you're adding | Where it goes |
|--------------------|--------------|
| New entity | `src/infrastructure/entities/` + interface in `src/domain/interfaces/` |
| New port | `src/ports/` |
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
