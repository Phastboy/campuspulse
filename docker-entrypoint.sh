#!/bin/sh
# docker-entrypoint.sh
# Runs database migrations then starts the application.
# Exits immediately if any command fails — ensures we never start
# with a schema that is behind the codebase.
set -e

echo "[entrypoint] Running database migrations..."
node -e "
const { MikroORM } = require('@mikro-orm/core');
const config = require('./dist/configs/mikro-orm.config').default;

MikroORM.init(config).then(async (orm) => {
  const migrator = orm.migrator;
  const pending = await migrator.getPending();
  if (pending.length > 0) {
    console.log('[entrypoint] Applying', pending.length, 'pending migration(s)...');
    await migrator.up();
    console.log('[entrypoint] Migrations complete.');
  } else {
    console.log('[entrypoint] No pending migrations.');
  }
  await orm.close();
}).catch((err) => {
  console.error('[entrypoint] Migration failed:', err.message);
  process.exit(1);
});
"

echo "[entrypoint] Starting application..."
exec node dist/main
