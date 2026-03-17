# scripts/

Development tooling scripts. Not part of the application runtime.

---

## generate-arch.mjs

Generates `docs/architecture.md` from the source tree.

```bash
pnpm arch
```

Run this after any structural change — adding a module, moving a class between layers, adding or removing a port.

**What it produces:**

`docs/architecture.md` contains three Mermaid diagrams and a port map table:

1. **Module graph** — NestJS module imports (framework modules omitted)
2. **DI graph** — class-level dependency injection, with port interfaces shown as dashed-arrow dependencies
3. **Layer diagram** — every component placed in its architectural layer

The file carries a `do not edit by hand` warning at the top. Any manual edits will be overwritten the next time `pnpm arch` runs.

**Note:** the script was written for the previous feature-module directory structure. It will need updating to walk the new flat directories (`src/services/`, `src/controllers/`, `src/infrastructure/`, etc.) rather than `src/events/` and `src/ingestion/`. Until updated, run `pnpm arch` and verify the output reflects the actual structure before committing it.
