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

1. **Module graph** — NestJS module imports (framework modules omitted for clarity)
2. **DI graph** — class-level dependency injection, with port interfaces shown as dashed-arrow dependencies
3. **Layer diagram** — every component placed in its architectural layer, with arrows showing the only allowed dependency direction

The file carries a `do not edit by hand` warning at the top. Any manual edits will be overwritten the next time `pnpm arch` runs.

**How it works:**

The script reads TypeScript source files directly — it does not execute the application or use the TypeScript compiler API. It extracts class names, NestJS decorators (`@Module`, `@Controller`, `@Injectable`), and import statements, then writes the Mermaid diagram syntax and the port map table.

The output file path is hardcoded to `docs/architecture.md` relative to the project root.
