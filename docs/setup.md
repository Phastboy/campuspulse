# Setup

How to run CampusPulse locally, with or without Docker.

---

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PostgreSQL 14+ — running locally, or a remote URL (Supabase, Railway, etc.)

---

## Quick start (local)

```bash
# 1. Clone and install
git clone https://github.com/Phastboy/campuspulse
cd campuspulse
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env — the minimum required value is DATABASE_URL

# 3. Apply migrations
pnpm migration:up

# 4. Start the dev server
pnpm dev
```

The API is available at `http://localhost:3000/api`.

---

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✓ | — | PostgreSQL connection string |
| `NODE_ENV` | | `development` | `development` \| `production` \| `test` |
| `PORT` | | `3000` | HTTP port |
| `GLOBAL_PREFIX` | | `api` | URL prefix for all routes |
| `SWAGGER_ENABLED` | | `false` | Enable Swagger UI |
| `SWAGGER_USER` | if enabled | — | Basic auth username for docs |
| `SWAGGER_PASS` | if enabled | — | Basic auth password for docs |
| `SWAGGER_SECURITY_NAME` | if enabled | — | Bearer auth scheme name in Swagger |
| `SWAGGER_PATH_DOCS` | | `api/docs` | Swagger UI path |
| `SWAGGER_PATH_JSON` | | `api/docs-json` | OpenAPI JSON path |

---

## Database migrations

MikroORM manages the schema. All migration commands run through `pnpm`:

```bash
# Generate a migration from entity changes
pnpm migration:create

# Apply pending migrations
pnpm migration:up

# Roll back the last migration
pnpm migration:down

# List all migrations and their status
pnpm migration:list
```

Migration files live in `src/database/migrations/`. Commit them alongside the entity changes that produced them.

---

## Swagger docs

Set `SWAGGER_ENABLED=true` in `.env` along with `SWAGGER_USER`, `SWAGGER_PASS`, and `SWAGGER_SECURITY_NAME`.

- UI: `http://localhost:3000/api/docs` (basic auth protected)
- OpenAPI JSON: `http://localhost:3000/api/docs-json`

---

## Docker — local development

```bash
cp .env.example .env    # fill in any overrides

docker compose up -d    # starts postgres + app (hot reload) + nginx
docker compose logs -f app
docker compose down
```

The stack:

- **postgres** — PostgreSQL 16, data persisted in a named volume, health-checked before the app starts
- **app** — runs `pnpm dev` (hot reload via `nest --watch`), source mounted read-only so changes are picked up without rebuilding
- **nginx** — listens on port 80, proxies to the app on the internal network

The app port (`3000`) is exposed directly to the host for debugging. In production it is not.

---

## Docker — production

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

The prod override:

- Targets the `production` Docker stage (compiled `dist/`, no source files)
- Removes source volume mounts
- Removes the direct app port exposure — all traffic goes through nginx
- Removes the postgres host port — the database is unreachable from outside the container network
- Adds CPU and memory limits to all three services
- Sets `restart: always`

The `docker-entrypoint.sh` script runs automatically on container start: it checks for pending migrations, applies them, then starts the app with `node dist/main`. The container exits non-zero if migrations fail — it will not start with a mismatched schema.

---

## Building the Docker image manually

```bash
# Build the production image
docker build --target production -t campuspulse:latest .

# Run it standalone (needs DATABASE_URL)
docker run -p 3000:3000 --env-file .env campuspulse:latest
```

The image is multi-stage:

| Stage | Purpose |
|-------|---------|
| `builder` | Installs all deps, compiles TypeScript via `nest build` |
| `production` | Installs prod deps only, copies `dist/`, runs as non-root user |

The build fails at `pnpm build` if TypeScript has errors — a broken app cannot produce a successful image.

---

## CI

The GitHub Actions workflow runs on every pull request to `main`:

```
check (type-check + lint)
   └── docker-build (builds production image)
```

`check` runs `tsc --noEmit` and `eslint`. `docker-build` only runs if `check` passes. Neither job pushes to a registry — the goal is to catch breakage before merge.
