import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Migrator } from '@mikro-orm/migrations';
import { ConfigService } from '@nestjs/config';

export const mikroOrmConfig = (
  configService: ConfigService,
): Options => ({
  driver: PostgreSqlDriver,

  clientUrl: configService.getOrThrow<string>('DATABASE_URL'),

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

  debug: configService.get('NODE_ENV') === 'development',
});
