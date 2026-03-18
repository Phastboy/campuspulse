# common/

Global exception filter. Nothing else lives here.

**Rule: `common/` imports from nothing inside `src/`.** It has no knowledge of domain, application types, or any feature. It is a pure utility that the NestJS bootstrap wires in globally.

```
common/
└── filters/
    └── all-exceptions.filter.ts   Catches all unhandled exceptions → ApiResponse.fail(...)
```

Constants and datetime types that previously lived in `common/constants/` and `common/datetime/` have moved to `domain/value-objects/` — they are domain concepts, not shared utilities.
