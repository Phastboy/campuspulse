import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Migrator } from '@mikro-orm/migrations';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * MikroORM configuration for the PostgreSQL driver.
 *
 * Used both by the NestJS app (via `MikroOrmModule.forRoot`) and by the
 * MikroORM CLI (`pnpm migration:*` scripts) through the `mikro-orm`
 * `configPaths` entry in `package.json`.
 *
 * Entity discovery:
 * - TypeScript source: `src/**\/*.entity.ts` — used by the CLI and in dev
 * - Compiled output: `dist/**\/*.entity.js` — used at runtime in production
 *
 * Migration settings enforce safety by default:
 * - `safe: true` — never drops columns or tables automatically
 * - `disableForeignKeys: false` — foreign key constraints remain active during migration
 * - `allOrNothing: true` — each migration runs in a single transaction
 */
const config: Partial<Options> = {
  driver: PostgreSqlDriver,
  driverOptions: {
    connection: {
      keepAlive: true,
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
