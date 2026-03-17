# configs/

All configuration for the application. No config is orphaned at the `src/` root or inside feature directories.

```
configs/
├── validation.ts       Zod env schema, AppConfig type, validateConfig()
├── mikro-orm.config.ts MikroORM connection and migration settings
└── swagger.config.ts   SwaggerSetup — optional basic-auth-protected API docs
```

---

## validation.ts

Defines the Zod schema for all environment variables and the `validateConfig` function passed to `ConfigModule.forRoot({ validate })`. Any missing required variable or invalid value causes an immediate startup failure with a descriptive error — misconfiguration is caught before the server accepts a single request.

Swagger variables are conditionally required: `SWAGGER_USER`, `SWAGGER_PASS`, and `SWAGGER_SECURITY_NAME` are only required when `SWAGGER_ENABLED=true`.

---

## mikro-orm.config.ts

Used in two places:

1. `AppModule` — `MikroOrmModule.forRoot(mikroOrmConfig)` at application startup
2. MikroORM CLI — via `configPaths` in `package.json`, which points to this file, enabling `pnpm migration:*` commands

Migration safety defaults: `safe: true` (never drops columns/tables automatically), `allOrNothing: true` (each migration in a single transaction), `disableForeignKeys: false` (constraints remain active during migration).

---

## swagger.config.ts

`SwaggerSetup.register(app)` — called unconditionally from `main.ts`; does nothing when `SWAGGER_ENABLED` is false. When enabled, both the UI path and the JSON spec path are protected by HTTP Basic Auth before the Swagger document is built.
