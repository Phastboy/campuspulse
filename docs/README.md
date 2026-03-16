# docs/

This directory contains all project documentation beyond the root README.

---

## What lives here

| File | Authored by | Description |
|------|-------------|-------------|
| [`setup.md`](setup.md) | Hand-written | Local dev setup, environment variables, Docker, migrations |
| [`api.md`](api.md) | Hand-written | Full API reference with request/response examples |
| [`architecture.md`](architecture.md) | **Auto-generated** | Module graph, DI graph, layer diagram, port map |
| [`contributing.md`](contributing.md) | Hand-written | Branching strategy, commit conventions, PR checklist |
| [`roadmap.md`](roadmap.md) | Hand-written | Planned phases and what changes in each |

---

## Auto-generated files

`architecture.md` is produced by `scripts/generate-arch.mjs` and must not be edited by hand. Changes are overwritten the next time the script runs.

Regenerate it after any structural change to the source tree:

```bash
pnpm arch
```

The script reads the source files, extracts module imports and class-level dependencies, and writes the Mermaid diagrams. See [`scripts/README.md`](../scripts/README.md) for how it works.

---

## Hand-written files

All other files in this directory are maintained by contributors. If you change something architectural — add a module, move a port, rename a class — update the relevant hand-written docs in the same PR.
