# ─── Stage 1: Base ────────────────────────────────────────────────────────────
FROM node:25-alpine AS base

RUN npm install -g pnpm@latest
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma/ ./prisma/
COPY prisma.config.ts ./

# ─── Stage 2: Development ─────────────────────────────────────────────────────
FROM base AS development

COPY docker-entrypoint.sh nest-cli.json tsconfig.json tsconfig.build.json ./
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]


# ─── Stage 3: Builder ─────────────────────────────────────────────────────────
FROM base AS builder

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src/ ./src/
RUN pnpm exec prisma generate && pnpm build

# ─── Stage 4: Migrator ────────────────────────────────────────────────────────
FROM base AS migrator

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN pnpm exec prisma migrate deploy


# ─── Stage 5: Production ──────────────────────────────────────────────────────
FROM node:25-alpine AS production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nestjs

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm@latest \
  && pnpm install --frozen-lockfile --prod \
  && pnpm store prune

COPY --from=builder /app/dist ./dist

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000
CMD ["node", "dist/src/main.js"]
