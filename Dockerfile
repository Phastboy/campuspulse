# ─── Stage 1: Build ───────────────────────────────────────────────────────────
# Full dev environment: installs all deps (including devDeps) and compiles TypeScript.
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy manifests first — dependency layer is cached independently of source changes
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy config files and source
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src/ ./src/

# Compile — fails fast if TypeScript has errors, so a broken build = broken image
RUN pnpm build


# ─── Stage 2: Production image ────────────────────────────────────────────────
# Minimal runtime: no source, no devDependencies, no build tools.
FROM node:22-alpine AS production

RUN corepack enable && corepack prepare pnpm@latest --activate

# Non-root user — principle of least privilege
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nestjs

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod \
 && pnpm store prune

# Copy compiled output from the builder stage
COPY --from=builder /app/dist ./dist

# Copy the entrypoint script before switching user
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh \
 && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

# Health check against the API root (AppController returns 200)
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
