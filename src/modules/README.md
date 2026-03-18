# modules/

Thin NestJS wiring modules. These files contain no business logic. Their only job is to declare which providers exist, map port tokens to adapter classes, and export tokens for other modules to consume.

```
modules/
├── app.module.ts        Root — global config, ORM, feature module imports
├── events.module.ts     Wires all event adapters to their port tokens
└── ingestion.module.ts  Wires ingestion pipeline and assembles SIMILARITY_RULES
```

---

## events.module.ts

Maps each port token to exactly one adapter. Exports all tokens so `IngestionModule` can consume `EVENT_CREATOR`, `CANDIDATE_REPOSITORY`, and `TRANSACTION_MANAGER` without importing any concrete adapter class.

| Token | Adapter |
|-------|---------|
| `EVENT_READER` | `MikroOrmEventReaderAdapter` |
| `EVENT_CREATOR` | `MikroOrmEventCreatorAdapter` |
| `EVENT_MUTATOR` | `MikroOrmEventMutatorAdapter` |
| `CANDIDATE_REPOSITORY` | `MikroOrmCandidateRepositoryAdapter` |
| `TRANSACTION_MANAGER` | `MikroOrmTransactionManagerAdapter` |

---

## ingestion.module.ts

Imports `EventsModule` to receive its exported tokens. Registers the ingestion pipeline providers and assembles the `SIMILARITY_RULES` array via a factory — `SimilarityEngine` receives all rules through injection rather than instantiating them directly.

---

## Why keep separate modules

NestJS modules are not just organisational folders — they are the encapsulation unit. They control what is exported and what stays private. Without them, everything is implicitly available to everything. As new feature modules are added (auth, notifications, etc.) each becomes one new file here and the relevant classes in the flat source directories.
