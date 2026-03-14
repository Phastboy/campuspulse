import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { IngestionModule } from './ingestion/ingestion.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from './database/mikro-orm.config';
import { validateConfig } from './config/validation';

/**
 * Root application module.
 *
 * Wires together all feature modules and global infrastructure:
 * - {@link ConfigModule} — environment variable loading and Zod validation
 * - {@link MikroOrmModule} — PostgreSQL connection via MikroORM
 * - {@link EventsModule} — published event CRUD and lifecycle
 * - {@link IngestionModule} — event submission pipeline and similarity engine
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
