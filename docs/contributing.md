# Contributing

Thanks for contributing to CampusPulse. This document covers the workflow, conventions, and checklist for getting a PR merged.

---

## Getting started

1. Fork the repository and clone your fork
2. Follow [`setup.md`](setup.md) to get the project running locally
3. Create a branch from `main` for your change

---

## Branching

Use descriptive branch names with a short prefix:

| Prefix | Use for |
|--------|---------|
| `feat/` | New features or behaviour |
| `fix/` | Bug fixes |
| `refactor/` | Internal changes with no behaviour change |
| `docs/` | Documentation only |
| `chore/` | Tooling, config, dependencies |

Examples: `feat/auth-module`, `fix/exact-match-date-comparison`, `docs/ingestion-readme`.

---

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short summary>

<optional body>
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`.

Keep the summary line under 72 characters. Use the body to explain *why*, not *what* — the diff shows what changed.

Examples:
```
feat(ingestion): add category field to EventSubmission
fix(similarity): handle null candidateDate in DateProximityRule
docs(events): add README for events module
refactor(common): extract EventFieldsDto base class
```

---

## Architecture rules

This codebase follows Clean Architecture with Ports & Adapters. Before writing code, read [`architecture.md`](architecture.md). The rules that must not be broken:

- Dependencies flow inward only: HTTP → Application → Domain ← Infrastructure
- Domain must not import from any framework, ORM, or HTTP library
- Application services must not import from infrastructure directly — use ports
- Controllers must not contain business logic — delegate to services
- Port interfaces must use domain types only — no DTOs, no ORM entities
- Nothing in `common/` may import from a feature module (`events`, `ingestion`)

A PR that breaks a layer boundary will not be merged regardless of whether CI passes — static analysis does not catch all violations.

---

## PR checklist

Before opening a pull request, confirm all of the following:

**Code**
- [ ] `pnpm build` succeeds (no TypeScript errors)
- [ ] `pnpm lint` passes with no errors
- [ ] No layer boundary violations (see architecture rules above)
- [ ] No new `any` casts without a comment explaining why
- [ ] No direct ORM imports outside of `src/*/repositories/`

**Tests**
- [ ] Existing tests still pass (`pnpm test`)
- [ ] New behaviour has unit tests where it makes sense

**Documentation**
- [ ] If you added a module or changed a layer boundary: update `architecture.md` by running `pnpm arch`
- [ ] If you added a new endpoint: update `docs/api.md`
- [ ] If you changed setup or environment variables: update `docs/setup.md`
- [ ] The directory you worked in has an up-to-date `README.md`

**PR description**
- [ ] Explains *what* changed and *why*
- [ ] Links to any related issues

---

## Running the full check locally

```bash
pnpm build       # TypeScript compile
pnpm lint        # ESLint
pnpm test        # Unit tests
pnpm test:e2e    # End-to-end tests
pnpm arch        # Regenerate architecture.md if structure changed
```

These are the same checks CI runs on every PR.

---

## Questions

If you're unsure about something — whether a change fits the architecture, which layer a new class belongs in, or how to test something — open a draft PR or a discussion. It is easier to correct a direction early than after the code is written.
