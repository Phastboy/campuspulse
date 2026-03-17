import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { IngestionModule } from './ingestion.module';
import mikroOrmConfig from '@configs/mikro-orm.config';
import { validateConfig } from '@configs/validation';

/**
 * Root application module.
 *
 * Wires global infrastructure (config, ORM) and imports feature modules.
 * Feature modules handle their own provider registration.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      validate: validateConfig,
    }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    IngestionModule,
  ],
})
export class AppModule {}
