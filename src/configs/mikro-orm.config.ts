import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Migrator } from '@mikro-orm/migrations';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Pool notes for Supabase transaction pooler (port 6543):
 * - keepAlive disabled — the pooler drops idle connections; keepAlive probes
 *   on dead connections emit unhandled pg pool errors that crash the process.
 * - pool.min=0 so MikroORM never holds idle connections the pooler will kill.
 * - pool.idleTimeoutMillis retires connections before the pooler drops them.
 */
const config: Partial<Options> = {
  driver: PostgreSqlDriver,
  driverOptions: {
    keepAlive: false,
    pool: {
      min: 0,
      max: 10,
      idleTimeoutMillis: 10_000,
    },
  },
  clientUrl: process.env.DATABASE_URL,
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  metadataProvider: TsMorphMetadataProvider,
  extensions: [Migrator],
  migrations: {
    path: './dist/database/migrations',
    pathTs: './src/database/migrations',
    glob: '!(*.d).{js,ts}',
    transactional: true,
    disableForeignKeys: false,
    allOrNothing: true,
    dropTables: false,
    safe: true,
    emit: 'ts',
  },
  debug: process.env.NODE_ENV === 'development',
};

export default config;
