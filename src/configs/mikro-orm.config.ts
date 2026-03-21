import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * MikroORM configuration for the PostgreSQL driver.
 *
 * Used both by the NestJS app (via `MikroOrmModule.forRoot`) and by the
 * MikroORM CLI (`pnpm migration:*`) through `configPaths` in `package.json`.
 */
export default defineConfig({
  clientUrl: process.env.DATABASE_URL,
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  metadataProvider: ReflectMetadataProvider,
  extensions: [Migrator],
  migrations: {
    path: './dist/database/migrations',
    pathTs: './src/database/migrations',
    glob: '!(*.d).{js,ts}',
    transactional: true,
    dropTables: false,
    safe: true,
  },
  debug: process.env.NODE_ENV === 'development',
});
