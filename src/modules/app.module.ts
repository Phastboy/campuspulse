import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EventsModule } from './events.module';
import { AuthModule } from './auth.module';
import mikroOrmConfig from '@configs/mikro-orm.config';
import { validateConfig } from '@configs/validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      validate: validateConfig,
    }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    AuthModule,
    EventsModule,
  ],
})
export class AppModule {}
