# configs/

All configuration for the application. No config is orphaned at `src/` root or inside feature directories.

```
configs/
├── validation.ts       Zod env schema, AppConfig type, validateConfig()
├── mikro-orm.config.ts MikroORM connection and migration settings
└── swagger.config.ts   SwaggerSetup — optional basic-auth-protected API docs
```

---

## validation.ts

Defines the Zod schema for all environment variables. Passed to `ConfigModule.forRoot({ validate })`. Any missing required variable or invalid value causes an immediate startup failure — misconfiguration is caught before the server accepts a single request.

## mikro-orm.config.ts

Used in two places: `AppModule` at startup (`MikroOrmModule.forRoot`) and the MikroORM CLI (`pnpm migration:*`) via `configPaths` in `package.json`. Migration safety defaults: `safe: true`, `allOrNothing: true`, `disableForeignKeys: false`.

## swagger.config.ts

`SwaggerSetup.register(app)` — called unconditionally from `main.ts`; does nothing when `SWAGGER_ENABLED` is false. When enabled, both the UI and JSON spec paths are protected by HTTP Basic Auth.
